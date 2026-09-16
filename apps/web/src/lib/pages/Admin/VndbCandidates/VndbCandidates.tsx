import { FC, useCallback, useEffect, useState } from "react";
import Image from "next/image";
import classNames from "classnames";
import { useQueryClient } from "@tanstack/react-query";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { usePlatformsQuery } from "@/src/lib/entities/platform/api/platform.queries";
import {
  nextVndbCandidateQueryOptions,
  useNextVndbCandidateQuery,
  useVndbCandidatesSummaryQuery,
} from "@/src/lib/entities/game/api/vndb-candidates.queries";
import { useDecideVndbCandidateMutation } from "@/src/lib/entities/game/api/vndb-candidates.mutations";
import { vndbCandidateQueryKeys } from "@/src/lib/entities/game/api/vndb-candidates.query-keys";
import { CandidateCard, Fact } from "./CandidateCard";
import { CandidateList } from "./CandidateList";
import { REASON_LABELS } from "./labels";
import styles from "./VndbCandidates.module.scss";

const SCROLL_STYLE = { maxHeight: "var(--vndb-review-height)" };

const pluralize = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;

const formatLength = (minutes: number) => `${Math.round(minutes / 6) / 10} h`;

const isTypingTarget = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  !!target.closest("input, textarea, select, [contenteditable='true']");

const VndbCandidates: FC = () => {
  const queryClient = useQueryClient();
  const [isReviewing, setIsReviewing] = useState(false);
  const [after, setAfter] = useState<string | null>(null);
  const [selection, setSelection] = useState({ itemId: "", index: 0 });

  const { data: summary } = useVndbCandidatesSummaryQuery();
  const { data, isLoading } = useNextVndbCandidateQuery(after, isReviewing);
  const { mutate: decide } = useDecideVndbCandidateMutation();
  const { data: platforms } = usePlatformsQuery();
  const isLoaderShown = useMinimumLoading(isLoading);

  const item = isReviewing ? (data?.item ?? null) : null;
  const selectedIndex =
    item && selection.itemId === item.id ? selection.index : 0;
  const selected = item?.candidates[selectedIndex];
  const vn = item?.vn;
  const pending = summary?.pending ?? 0;
  const applying = summary?.applying ?? 0;

  const platformNames = (ids: string[]) =>
    ids
      .map((id) => platforms?.find(({ _id }) => _id === id)?.name)
      .filter(Boolean)
      .join(", ");

  const select = useCallback(
    (index: number) => item && setSelection({ itemId: item.id, index }),
    [item]
  );

  const resolve = useCallback(
    (gameId: string | null) => {
      if (!item) return;

      decide({ vnId: item.vnId, gameId });
      setAfter(item.id);
    },
    [item, decide]
  );

  useEffect(() => {
    if (item) queryClient.prefetchQuery(nextVndbCandidateQueryOptions(item.id));
  }, [item, queryClient]);

  useEffect(() => {
    if (!item) return;

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
        select(
          Math.min(
            Math.max(selectedIndex + step, 0),
            item.candidates.length - 1
          )
        );
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (!event.repeat) resolve(null);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (!event.repeat && selected?.game) resolve(selected.gameId);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => window.removeEventListener("keydown", onKeyDown);
  }, [item, selectedIndex, selected, select, resolve]);

  const startReview = () => {
    queryClient.removeQueries({ queryKey: vndbCandidateQueryKeys.nextAll() });
    setAfter(null);
    setIsReviewing(true);
  };

  return (
    <div className={styles.review}>
      <div className={styles.toolbar}>
        <p className={styles.status}>
          {summary &&
            (pending
              ? `${pluralize(pending, "VN")} waiting for a decision`
              : "No VNs wait for a decision")}
          {applying > 0 &&
            ` · ${pluralize(applying, "decision")} being written to games`}
        </p>
        {isReviewing ? (
          item && (
            <p className={styles.status}>{item.remaining} left in this pass</p>
          )
        ) : (
          <Button
            color={ButtonColor.ACCENT}
            disabled={!pending}
            onClick={startReview}
          >
            Start review
          </Button>
        )}
      </div>

      {!isReviewing && <CandidateList />}

      {isReviewing &&
        (isLoaderShown ? (
          <div className={styles.loading}>
            <Loader type="pulse" />
          </div>
        ) : !item ? (
          <p className={styles.placeholder}>
            Review finished. Every VN in the queue has a decision.
          </p>
        ) : (
          <>
            <div className={styles.split}>
              <section className={styles.panel} aria-label="VNDB entry">
                <Scrollbar contentStyle={SCROLL_STYLE}>
                  <div className={styles.vn}>
                    <div className={styles.vn__head}>
                      <a
                        className={styles.eyebrow}
                        href={`https://vndb.org/${item.vnId}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        VNDB {item.vnId}
                      </a>
                      {item.reason && (
                        <span className={styles.reason}>
                          {REASON_LABELS[item.reason]}
                        </span>
                      )}
                    </div>

                    {vn ? (
                      <>
                        <div className={styles.vn__title}>
                          {vn.cover && (
                            <Image
                              className={classNames(styles.vn__cover, {
                                [styles.vn__cover_explicit]:
                                  vn.isExplicitCover,
                              })}
                              src={vn.cover}
                              width={120}
                              height={160}
                              alt={vn.name}
                            />
                          )}
                          <div>
                            <h3 className={styles.vn__name}>{vn.name}</h3>
                            {vn.originalName !== vn.name && (
                              <p className={styles.muted}>{vn.originalName}</p>
                            )}
                          </div>
                        </div>

                        <dl className={styles.facts}>
                          <Fact label="Released" value={vn.released} />
                          <Fact
                            label="Developers"
                            value={vn.developers.join(", ")}
                          />
                          <Fact
                            label="Platforms"
                            value={platformNames(vn.platformIds)}
                          />
                          <Fact
                            label="Also known as"
                            value={vn.alternativeNames.join(" · ")}
                          />
                          <Fact
                            label="Length"
                            value={
                              vn.lengthMinutes
                                ? formatLength(vn.lengthMinutes)
                                : null
                            }
                          />
                        </dl>

                        {vn.description && (
                          <p className={styles.description}>
                            {vn.description}
                          </p>
                        )}
                      </>
                    ) : (
                      <p className={styles.muted}>
                        VNDB no longer has {item.vnId}. A decision on it
                        returns to the queue.
                      </p>
                    )}
                  </div>
                </Scrollbar>
              </section>

              <section className={styles.panel} aria-label="Catalogue candidates">
                <Scrollbar contentStyle={SCROLL_STYLE}>
                  <p className={styles.eyebrow}>
                    {pluralize(item.candidates.length, "candidate")} in the
                    catalogue
                  </p>
                  <ul className={styles.candidates}>
                    {item.candidates.map((candidate, index) => (
                      <CandidateCard
                        key={candidate.gameId}
                        candidate={candidate}
                        isSelected={index === selectedIndex}
                        isMatchShown={item.candidates.length > 1}
                        platformNames={platformNames}
                        onSelect={() => select(index)}
                        onMatch={() => resolve(candidate.gameId)}
                      />
                    ))}
                  </ul>
                </Scrollbar>
              </section>
            </div>

            <div className={styles.actions}>
              <div className={styles.action}>
                <Button
                  className={styles.actionButton}
                  onClick={() => resolve(null)}
                >
                  <kbd className={styles.key}>←</kbd>
                  Skip
                </Button>
                <span className={styles.caption}>Adds it as a new game</span>
              </div>

              <p className={styles.hint}>
                <kbd className={styles.key}>↑</kbd>
                <kbd className={styles.key}>↓</kbd>
                choose a candidate
              </p>

              <div className={classNames(styles.action, styles.action_end)}>
                <span className={styles.caption}>
                  {selected ? `Updates ${selected.name}` : ""}
                </span>
                <Button
                  className={styles.actionButton}
                  color={ButtonColor.GREEN}
                  disabled={!selected?.game}
                  onClick={() => selected && resolve(selected.gameId)}
                >
                  Match
                  <kbd className={styles.key}>→</kbd>
                </Button>
              </div>
            </div>
          </>
        ))}
    </div>
  );
};

export default VndbCandidates;
