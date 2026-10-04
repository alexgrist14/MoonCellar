import { FC, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import { useSearchParams } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Badge } from "@/src/lib/shared/ui/Badge";
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
  useReopenConflictMutation,
} from "@/src/lib/entities/conflict/api";
import { setAdminQuery } from "@/src/lib/shared/utils/admin-url.utils";
import { CandidateCard, Fact } from "./CandidateCard";
import { CandidateSearch } from "./CandidateSearch";
import { ConflictList } from "./ConflictList";
import { EntryCard } from "./EntryCard";
import {
  CONFLICT_SOURCES,
  REASON_LABELS,
  SOURCE_LABELS,
  skipCaption,
  isReopenable,
  stateLabel,
  stateTone,
  parseConflictSource,
} from "./labels";
import styles from "./Conflicts.module.scss";

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
  const { mutate: reopen, isPending: isReopening } =
    useReopenConflictMutation();
  const { data: platforms } = usePlatformsQuery();
  const isLoaderShown = useMinimumLoading(isLoading);

  useConflictsSocket(externalId);

  const item = data?.item ?? null;
  const selectedIndex =
    item && selection.externalId === item.externalId ? selection.index : 0;
  const isEntries = item?.direction === "entries";
  const options = !item
    ? []
    : isEntries
      ? item.entries.map(({ id, name }) => ({ id, name, isUsable: true }))
      : item.candidates.map(({ gameId, name, game }) => ({
          id: gameId,
          name,
          isUsable: !!game,
        }));
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
          <ConflictList source={source} />
        </>
      )}

      {!!externalId &&
        (isLoaderShown ? (
          <Loader minHeight="var(--community-loading-height)" />
        ) : !item ? (
          <EmptyState
            title={`No conflict record for ${externalId}.`}
            description="The queue never held it, or it was removed."
          />
        ) : (
          <>
            <div className={styles.split}>
              <section
                className={styles.panel}
                aria-label={`${sourceName} entry`}
              >
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
                          {sourceName} {item.externalId}
                        </a>
                      ) : (
                        <span className={styles.eyebrow}>
                          {sourceName} {item.externalId}
                        </span>
                      )}
                      {item.reason && (
                        <span className={styles.reason}>
                          {REASON_LABELS[item.reason]}
                        </span>
                      )}
                      {!isDecidable && (
                        <Badge tone={stateTone(item.state)}>
                          {stateLabel(item.source, item.state)}
                          {item.decidedBy && ` · ${item.decidedBy}`}
                        </Badge>
                      )}
                    </div>

                    {subject ? (
                      <>
                        <div className={styles.vn__title}>
                          {subject.cover && (
                            <Image
                              className={classNames(styles.vn__cover, {
                                [styles.vn__cover_explicit]:
                                  subject.isExplicitCover,
                              })}
                              src={subject.cover}
                              width={120}
                              height={160}
                              alt={subject.name}
                            />
                          )}
                          <div>
                            <h3 className={styles.vn__name}>{subject.name}</h3>
                            {subject.originalName !== subject.name && (
                              <p className={styles.muted}>
                                {subject.originalName}
                              </p>
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

                        {subject.description && (
                          <p className={styles.description}>
                            {subject.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className={styles.muted}>
                        {sourceName} no longer has {item.externalId}. A decision
                        on it returns to the queue.
                      </p>
                    )}
                  </div>
                </Scrollbar>
              </section>

              <section
                className={styles.panel}
                aria-label={
                  isEntries ? `${sourceName} entries` : "Catalogue candidates"
                }
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
                <span className={styles.caption}>
                  {skipCaption(item.source)}
                </span>
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
                    {isReopenable(item.source, item.state) && (
                      <Button
                        className={styles.actionButton}
                        disabled={isReopening}
                        onClick={() =>
                          reopen({
                            source: item.source,
                            externalId: item.externalId,
                          })
                        }
                      >
                        {isReopening ? "Reopening…" : "Reopen"}
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
