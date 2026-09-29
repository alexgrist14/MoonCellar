import { FC, ReactNode, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";
import {
  IGameResponse,
  ILogChanges,
  ILogPlaythrough,
  ILogRating,
} from "@mooncellar/schemas";
import {
  IUserLogWithGame,
  useUserLogsQuery,
} from "@/src/lib/entities/user/api/user.queries";
import { useRemoveUserLogMutation } from "@/src/lib/entities/user/api/user.mutations";
import { takeLogs } from "@/src/lib/shared/constants/user.const";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  getLogTone,
  getPlaythroughDetails,
  getStatusLabel,
  getTimeLabel,
  isReviewAdded,
  isStatusChanged,
} from "./activity.utils";
import styles from "./ActivityTimeline.module.scss";

interface IActivityTimelineProps {
  userId: string;
  isOwner: boolean;
}

const UNDO_DELAY_MS = 5000;

const RatingValue: FC<{ value: number }> = ({ value }) => (
  <span className={styles.rating}>
    <SvgStar size="16" fillPercent={100} />
    {value}
  </span>
);

const getStatusChange = ({ action, before, after }: ILogPlaythrough) =>
  action !== "removed" && (action === "added" || isStatusChanged(before, after))
    ? getStatusLabel(after)
    : undefined;

const getPlaythroughSentence = ({ action, before }: ILogPlaythrough) =>
  action === "removed"
    ? `Removed from ${before?.category ?? "playthroughs"}`
    : action === "added"
      ? "Added to playthroughs"
      : "Updated the playthrough";

const getRatingSentence = ({ value }: ILogRating): ReactNode =>
  value !== null ? (
    <>
      Rated <RatingValue value={value} />
    </>
  ) : (
    "Removed the rating"
  );

const getLogContent = ({ playthrough, rating, favorite }: ILogChanges) => {
  const lines: ReactNode[] = [];
  const status = playthrough && getStatusChange(playthrough);
  const details = playthrough
    ? getPlaythroughDetails(playthrough).filter(
        (detail): detail is string => !!detail
      )
    : [];

  if (playthrough) {
    const hasReview = isReviewAdded(playthrough);
    const isOnlyReview =
      hasReview &&
      playthrough.action === "updated" &&
      !status &&
      !details.length;

    if (!status && !isOnlyReview) {
      lines.push(getPlaythroughSentence(playthrough));
    }
    if (hasReview) lines.push("Wrote a review");
  }
  if (rating) lines.push(getRatingSentence(rating));
  if (favorite !== undefined) {
    lines.push(favorite ? "Put in the top 10" : "Removed from the top 10");
  }

  return { status, details, lines };
};

export const ActivityTimeline: FC<IActivityTimelineProps> = ({
  userId,
  isOwner,
}) => {
  const [page, setPage] = useState(1);
  const sectionRef = useRef<HTMLElement>(null);

  const { data, isLoading, isFetching, isPlaceholderData } = useUserLogsQuery(
    userId,
    page,
    takeLogs
  );
  const isLogsLoading = useMinimumLoading(isLoading);
  const { mutate: removeLog } = useRemoveUserLogMutation();

  const logs = (data?.results ?? []).filter(
    (log): log is IUserLogWithGame & { game: IGameResponse } => !!log.game
  );
  const total = data?.total ?? 0;
  const now = new Date();

  const [pendingIds, setPendingIds] = useState<string[]>([]);
  const timersRef = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useEffect(() => {
    const timers = timersRef.current;

    return () => {
      timers.forEach((timer, logId) => {
        clearTimeout(timer);
        removeLog({ userId, _id: logId });
      });
      timers.clear();
    };
  }, [removeLog, userId]);

  const handleDelete = (logId: string) => {
    setPendingIds((ids) => [...ids, logId]);
    timersRef.current.set(
      logId,
      setTimeout(() => {
        timersRef.current.delete(logId);
        removeLog(
          { userId, _id: logId },
          {
            onError: () => {
              setPendingIds((ids) => ids.filter((id) => id !== logId));
              toast.error({ description: "Could not delete the entry" });
            },
          }
        );
      }, UNDO_DELAY_MS)
    );
  };

  const handleUndo = (logId: string) => {
    clearTimeout(timersRef.current.get(logId));
    timersRef.current.delete(logId);
    setPendingIds((ids) => ids.filter((id) => id !== logId));
  };

  return (
    <section
      ref={sectionRef}
      className={styles.activity}
      aria-labelledby="profile-activity"
    >
      <SectionTitle as="h3">
        <span id="profile-activity">Activity</span>
      </SectionTitle>
      <div
        className={classNames(styles.body, {
          [styles.body_pending]: isPlaceholderData,
        })}
        aria-busy={isLogsLoading || isPlaceholderData}
      >
        {isLogsLoading && <Loader type="moon" />}
        {!isLogsLoading && !logs.length && (
          <div className={styles.empty}>
            <SvgPlay size="24" style={{ color: "inherit" }} />
            <p>
              {isOwner
                ? "Nothing here yet. Add a game to your playthroughs and it will show up in the activity."
                : "No activity yet."}
            </p>
          </div>
        )}
        {!isLogsLoading && !!logs.length && (
          <>
            <ol className={styles.grid}>
              {logs.map((log) => {
                const { status, details, lines } = getLogContent(log);

                if (pendingIds.includes(log._id)) {
                  return (
                    <li key={log._id} className={styles.removed} role="status">
                      <span>Entry deleted</span>
                      <button
                        type="button"
                        className={styles.removed__undo}
                        onClick={() => handleUndo(log._id)}
                      >
                        Undo
                      </button>
                    </li>
                  );
                }

                return (
                  <li
                    key={log._id}
                    className={classNames(
                      styles.entry,
                      styles[`entry_${getLogTone(log)}`]
                    )}
                  >
                    <Link
                      href={`/games/${log.game.slug}`}
                      className={styles.cover}
                      tabIndex={-1}
                      aria-hidden="true"
                    >
                      {log.game.cover ? (
                        <Image
                          src={log.game.cover}
                          alt=""
                          fill
                          sizes="160px"
                          className={styles.cover__image}
                        />
                      ) : (
                        <Cover isWithoutText className={styles.cover__image} />
                      )}
                    </Link>
                    <div className={styles.content}>
                      <div className={styles.head}>
                        <Link
                          href={`/games/${log.game.slug}`}
                          className={styles.title}
                        >
                          {log.game.name}
                        </Link>
                        {status && (
                          <span className={styles.status}>{status}</span>
                        )}
                      </div>
                      {!!details.length && (
                        <div className={styles.details}>
                          {details.map((detail) => (
                            <span key={detail} className={styles.detail}>
                              {detail}
                            </span>
                          ))}
                        </div>
                      )}
                      {lines.map((line, index) => (
                        <span key={index} className={styles.line}>
                          {line}
                        </span>
                      ))}
                      <div className={styles.foot}>
                        <time dateTime={log.date}>
                          {getTimeLabel(new Date(log.date), now)}
                        </time>
                        {isOwner && (
                          <>
                            <span aria-hidden="true">·</span>
                            <button
                              type="button"
                              className={styles.delete}
                              onClick={() => handleDelete(log._id)}
                            >
                              Delete
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
            <Pagination
              take={takeLogs}
              total={total}
              isDisabled={isFetching}
              page={page}
              onPageChange={setPage}
              scrollTargetRef={sectionRef}
            />
          </>
        )}
      </div>
    </section>
  );
};
