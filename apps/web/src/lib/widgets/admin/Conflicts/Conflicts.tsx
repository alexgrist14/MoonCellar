import { FC, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal";
import { modal } from "@/src/lib/shared/ui/Modal";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { pluralize } from "@/src/lib/shared/utils/plural.utils";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { usePlatformsQuery } from "@/src/lib/entities/platform/api/platform.queries";
import { IConflictSource } from "@mooncellar/schemas";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import {
  conflictItemQueryOptions,
  useConflictItemQuery,
  useConflictsSocket,
  useConflictsSummaryQuery,
  useDecideConflictMutation,
  useUndoConflictMutation,
} from "@/src/lib/entities/conflict/api";
import { setAdminQuery } from "@/src/lib/shared/utils/admin-url.utils";
import { CandidateCard, Fact } from "./CandidateCard";
import { CandidateSearch } from "./CandidateSearch";
import { ConflictList } from "./ConflictList";
import { EntryCard } from "./EntryCard";
import { AiControls } from "./AiControls";
import {
  aiVerdictTone,
  CONFLICT_SOURCES,
  REASON_LABELS,
  SOURCE_LABELS,
  isServerBlockedImage,
  stateLabel,
  stateTone,
  parseConflictSource,
} from "./labels";
import styles from "./Conflicts.module.scss";

const UNDO_SKIP_MODAL_ID = "undo-conflict-skip";

const SCROLL_STYLE = { maxHeight: "var(--vndb-review-height)" };

const formatLength = (minutes: number) => `${Math.round(minutes / 6) / 10} h`;

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  !!target.closest("input, textarea, select, [contenteditable='true']");

const openConflict = (
  source: IConflictSource | null,
  externalId: string | null,
  isReplace?: boolean
) => setAdminQuery({ source, conflict: externalId }, isReplace);

export const Conflicts: FC = () => {
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const source = parseConflictSource(searchParams.get("source"));
  const externalId = source ? searchParams.get("conflict") : null;
  const [failedCovers, setFailedCovers] = useState<Set<string>>(
    () => new Set()
  );
  const [selection, setSelection] = useState({ externalId: "", index: 0 });
  const [chosen, setChosen] = useState<{ externalId: string; ids: string[] }>({
    externalId: "",
    ids: [],
  });

  const { data: summary } = useConflictsSummaryQuery(source);
  const { data, isLoading } = useConflictItemQuery(
    source ?? "vndb",
    externalId
  );
  const { mutate: decide } = useDecideConflictMutation();
  const {
    mutate: undo,
    mutateAsync: undoAsync,
    isPending: isUndoing,
  } = useUndoConflictMutation();
  const { data: platforms } = usePlatformsQuery();
  const isLoaderShown = useMinimumLoading(isLoading);

  useConflictsSocket(externalId);

  const item = data?.item ?? null;
  const isEntries = item?.direction === "entries";
  const verdict = item?.aiVerdict ?? null;
  const aiPicks = verdict && !verdict.undoneAt ? verdict.gameIds : [];
  const options = !item
    ? []
    : isEntries
      ? item.entries.map(({ id, name }) => ({ id, name, isUsable: true }))
      : item.candidates.map(({ gameId, name, game }) => ({
          id: gameId,
          name,
          isUsable: !!game,
        }));
  const selectedIndex =
    item && selection.externalId === item.externalId
      ? selection.index
      : Math.max(
          options.findIndex(({ id }) => aiPicks.includes(id)),
          0
        );
  const selected = options[selectedIndex];
  const optionsCount = options.length;
  const isMultiMatch = !!item?.isMultiMatch;
  const chosenIds =
    item && chosen.externalId === item.externalId ? chosen.ids : [];
  const matchOptions = chosenIds.length
    ? options.filter(({ id }) => chosenIds.includes(id))
    : selected?.isUsable
      ? [selected]
      : [];
  const isDecidable = item?.state === "waiting";
  const subject = item?.subject;
  const sourceName = item ? SOURCE_LABELS[item.source] : "";
  const subjectLabel = isEntries
    ? "Catalogue game"
    : `${sourceName} ${item?.externalId ?? ""}`;
  const sourceIndex = source ? CONFLICT_SOURCES.indexOf(source) + 1 : 0;
  const pending = summary?.pending ?? 0;
  const applying = summary?.applying ?? 0;

  const platformNames = (ids: string[]) =>
    ids
      .map((id) => platforms?.find(({ _id }) => _id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const select = useCallback(
    (index: number) =>
      item && setSelection({ externalId: item.externalId, index }),
    [item]
  );

  const toggle = useCallback(
    (id: string) =>
      item &&
      setChosen((previous) => {
        const ids = previous.externalId === item.externalId ? previous.ids : [];

        return {
          externalId: item.externalId,
          ids: ids.includes(id)
            ? ids.filter((chosenId) => chosenId !== id)
            : [...ids, id],
        };
      }),
    [item]
  );

  const resolve = useCallback(
    (ids: string[]) => {
      if (!item || item.state !== "waiting") return;

      decide({
        source: item.source,
        externalId: item.externalId,
        choice:
          item.direction === "entries"
            ? { entryId: ids[0] ?? null }
            : ids.length > 1
              ? { gameIds: ids }
              : { gameId: ids[0] ?? null },
      });
      openConflict(item.source, item.nextExternalId, true);
    },
    [item, decide]
  );

  useEffect(() => {
    if (item?.nextExternalId) {
      queryClient.prefetchQuery(
        conflictItemQueryOptions(item.source, item.nextExternalId)
      );
    }
  }, [item, queryClient]);

  useEffect(() => {
    if (!item || !isDecidable) return;

    const onKeyDown = (event: KeyboardEvent) => {
      if (
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        isTypingTarget(event.target)
      ) {
        return;
      }

      if (event.key === "ArrowUp" || event.key === "ArrowDown") {
        event.preventDefault();
        const step = event.key === "ArrowUp" ? -1 : 1;
        select(Math.min(Math.max(selectedIndex + step, 0), options.length - 1));
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!event.repeat) resolve([]);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!event.repeat && matchOptions.length) {
          resolve(matchOptions.map(({ id }) => id));
        }
      } else if (event.code === "KeyA" && isMultiMatch) {
        event.preventDefault();
        if (!event.repeat && selected?.isUsable) toggle(selected.id);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    item,
    isDecidable,
    selectedIndex,
    selected,
    optionsCount,
    matchOptions,
    isMultiMatch,
    select,
    toggle,
    resolve,
  ]);

  const subjectPanel = item && (
    <section key="subject" className={styles.panel} aria-label={subjectLabel}>
      <Scrollbar contentStyle={SCROLL_STYLE}>
        <div className={styles.vn}>
          <div className={styles.vn__head}>
            {subject?.url ? (
              <a
                className={styles.eyebrow}
                href={subject.url}
                target="_blank"
                rel="noreferrer"
              >
                {subjectLabel}
              </a>
            ) : (
              <span className={styles.eyebrow}>{subjectLabel}</span>
            )}
            {item.reason && (
              <span className={styles.reason}>
                {REASON_LABELS[item.reason]}
              </span>
            )}
            {!isDecidable && (
              <Badge tone={stateTone(item.state)}>
                {stateLabel(item.state)}
                {item.decidedBy && ` · ${item.decidedBy}`}
              </Badge>
            )}
          </div>

          {subject ? (
            <>
              <div className={styles.vn__title}>
                {subject.cover && !failedCovers.has(subject.cover) && (
                  <Image
                    className={classNames(styles.vn__cover, {
                      [styles.vn__cover_explicit]: subject.isExplicitCover,
                    })}
                    src={subject.cover}
                    width={120}
                    height={160}
                    alt={subject.name}
                    unoptimized={isServerBlockedImage(subject.cover)}
                    onError={() =>
                      setFailedCovers((covers) =>
                        new Set(covers).add(subject.cover!)
                      )
                    }
                  />
                )}
                <div>
                  <h3 className={styles.vn__name}>{subject.name}</h3>
                  {subject.originalName !== subject.name && (
                    <p className={styles.muted}>{subject.originalName}</p>
                  )}
                </div>
              </div>

              <dl className={styles.facts}>
                <Fact label="Released" value={subject.released} />
                <Fact
                  label="Developers"
                  value={subject.developers.join(", ")}
                />
                <Fact
                  label="Platforms"
                  value={platformNames(subject.platformIds)}
                />
                <Fact
                  label="Also known as"
                  value={subject.alternativeNames.join(" · ")}
                />
                <Fact
                  label="Length"
                  value={
                    subject.lengthMinutes
                      ? formatLength(subject.lengthMinutes)
                      : null
                  }
                />
              </dl>

              {verdict && (
                <div className={styles.verdict}>
                  <Badge tone={aiVerdictTone(verdict)}>
                    AI · {verdict.confidence}
                    {!verdict.gameIds.length && " · no match"}
                    {verdict.undoneAt && " · undone"}
                  </Badge>
                  <p className={styles.description}>
                    {verdict.gameIds.length
                      ? `Picks ${options
                          .filter(({ id }) => verdict.gameIds.includes(id))
                          .map(({ name }) => name)
                          .join(" and ")}. `
                      : "No candidate is this entry. "}
                    {verdict.reason}
                  </p>
                </div>
              )}

              {subject.description && (
                <p className={styles.description}>{subject.description}</p>
              )}
            </>
          ) : (
            <p className={styles.muted}>
              {isEntries
                ? "The catalogue no longer has this game."
                : `${sourceName} no longer has ${item.externalId}.`}{" "}
              A decision on it returns to the queue.
            </p>
          )}
        </div>
      </Scrollbar>
    </section>
  );

  const optionsPanel = item && (
    <section
      key="options"
      className={styles.panel}
      aria-label={isEntries ? `${sourceName} entries` : "Catalogue candidates"}
    >
      <Scrollbar contentStyle={SCROLL_STYLE}>
        <p className={styles.eyebrow}>
          {isEntries
            ? `${pluralize(options.length, "entry", "entries")} on ${sourceName}`
            : `${pluralize(options.length, "candidate")} in the catalogue`}
        </p>
        <ul className={styles.candidates}>
          {item.entries.map((entry, index) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              isSelected={index === selectedIndex}
              onSelect={() => select(index)}
            />
          ))}
          {item.candidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.gameId}
              candidate={candidate}
              isSelected={index === selectedIndex}
              isChosen={chosenIds.includes(candidate.gameId)}
              isAiPick={aiPicks.includes(candidate.gameId)}
              platformNames={platformNames}
              onSelect={() => select(index)}
              onToggle={
                isMultiMatch && isDecidable
                  ? () => toggle(candidate.gameId)
                  : undefined
              }
            />
          ))}
        </ul>
        {!isEntries && isDecidable && (
          <CandidateSearch
            key={item.id}
            item={item}
            onAdded={() => select(0)}
          />
        )}
      </Scrollbar>
    </section>
  );

  return (
    <div className={styles.review}>
      <div className={styles.toolbar}>
        <p className={styles.status}>
          {summary &&
            (pending
              ? `${pluralize(pending, "conflict")} waiting for a decision`
              : "No conflicts wait for a decision")}
          {applying > 0 &&
            ` · ${pluralize(applying, "decision")} being written to games`}
        </p>
        {externalId ? (
          <div className={classNames(styles.action, styles.action_end)}>
            {!!item && (
              <p className={styles.status}>
                {item.remaining} left in the queue
              </p>
            )}
            <Button onClick={() => openConflict(source ?? null, null)}>
              Back to the list
            </Button>
          </div>
        ) : (
          <Button
            color={ButtonColor.ACCENT}
            disabled={!summary?.firstExternalId}
            onClick={() =>
              openConflict(
                summary?.firstSource ?? null,
                summary?.firstExternalId ?? null
              )
            }
          >
            Start review
          </Button>
        )}
      </div>

      {!externalId && (
        <>
          <Tabs
            theme="segmented"
            ariaLabel="Source"
            mobileMenuTitle="Source"
            defaultTabIndex={sourceIndex}
            isUseDefaultIndex
            contents={[
              {
                tabName: "All",
                onTabClick: () => openConflict(null, null, true),
              },
              ...CONFLICT_SOURCES.map((name) => ({
                tabName: SOURCE_LABELS[name],
                count: summary?.bySource[name],
                onTabClick: () => openConflict(name, null, true),
              })),
            ]}
          />
          <AiControls source={source} isApplying={applying > 0} />
          <ConflictList source={source} />
        </>
      )}

      {!!externalId &&
        (isLoaderShown ? (
          <div className={styles.split} role="status" aria-label="Loading">
            <Skeleton
              height="var(--vndb-review-height)"
              radius="var(--radius-x4)"
            />
            <Skeleton
              height="var(--vndb-review-height)"
              radius="var(--radius-x4)"
            />
          </div>
        ) : !item ? (
          <EmptyState
            title={`No conflict record for ${externalId}.`}
            description="The queue never held it, or it was removed."
          />
        ) : (
          <>
            <div
              className={classNames(styles.split, {
                [styles.split_entries]: isEntries,
              })}
            >
              {isEntries
                ? [optionsPanel, subjectPanel]
                : [subjectPanel, optionsPanel]}
            </div>

            <div className={styles.actions}>
              <div className={styles.action}>
                <Button
                  className={styles.actionButton}
                  disabled={!isDecidable}
                  onClick={() => resolve([])}
                >
                  <kbd className={styles.key}>←</kbd>
                  Skip
                </Button>
                <span className={styles.caption}>Adds it as a new game</span>
              </div>

              {isDecidable ? (
                <p className={classNames(styles.hint, styles.hint_keys)}>
                  <kbd className={styles.key}>↑</kbd>
                  <kbd className={styles.key}>↓</kbd>
                  choose a candidate
                  {isMultiMatch && (
                    <>
                      <kbd className={styles.key}>A</kbd>
                      link several
                    </>
                  )}
                </p>
              ) : (
                <p className={styles.hint}>
                  {item.decidedBy
                    ? `${item.decidedBy} already decided this conflict`
                    : "This conflict already has a decision"}
                </p>
              )}

              <div className={classNames(styles.action, styles.action_end)}>
                {isDecidable ? (
                  <>
                    <span className={styles.caption}>
                      {matchOptions.length
                        ? `Links it to ${matchOptions.map(({ name }) => name).join(" and ")}`
                        : ""}
                    </span>
                    <Button
                      className={styles.actionButton}
                      color={ButtonColor.GREEN}
                      disabled={!matchOptions.length}
                      onClick={() => resolve(matchOptions.map(({ id }) => id))}
                    >
                      {matchOptions.length > 1
                        ? `Match ${matchOptions.length}`
                        : "Match"}
                      <kbd className={styles.key}>→</kbd>
                    </Button>
                  </>
                ) : (
                  <>
                    {item.isUndoable && (
                      <Button
                        className={styles.actionButton}
                        disabled={isUndoing}
                        onClick={() => {
                          const target = {
                            source: item.source,
                            externalId: item.externalId,
                          };

                          if (!item.createdGame) return undo(target);

                          modal.open(
                            <ConfirmModal
                              title="Undo the new game"
                              message={`Delete "${item.createdGame.name}", the game this Skip added, and put ${item.externalId} back in the queue?`}
                              warning="Refused when the game already has playthroughs, ratings, comments or list entries."
                              confirmText="Delete and requeue"
                              onConfirm={() =>
                                undoAsync(target).then(() =>
                                  modal.close(UNDO_SKIP_MODAL_ID)
                                )
                              }
                              onCancel={() => modal.close(UNDO_SKIP_MODAL_ID)}
                            />,
                            { id: UNDO_SKIP_MODAL_ID }
                          );
                        }}
                      >
                        {isUndoing
                          ? "Undoing…"
                          : item.state === "matched"
                            ? "Undo match"
                            : item.createdGame
                              ? "Undo new game"
                              : "Undo skip"}
                      </Button>
                    )}
                    {!!item.nextExternalId && (
                      <Button
                        className={classNames(
                          styles.actionButton,
                          styles.nextButton
                        )}
                        color={ButtonColor.ACCENT}
                        onClick={() =>
                          openConflict(item.source, item.nextExternalId, true)
                        }
                      >
                        Open the next waiting conflict
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </>
        ))}
    </div>
  );
};
