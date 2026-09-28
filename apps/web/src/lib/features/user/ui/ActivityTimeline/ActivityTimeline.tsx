import { FC, Fragment, ReactNode, useRef, useState } from "react";
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
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { StatusDetails } from "@/src/lib/shared/ui/StatusBadge";
import { SvgClose, SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  getDayLabel,
  getLogTone,
  getPlaythroughDetails,
  getStatusPhrase,
  getTimeLabel,
  isStatusChanged,
} from "./activity.utils";
import styles from "./ActivityTimeline.module.scss";

interface IActivityTimelineProps {
  userId: string;
  isOwner: boolean;
}

const RatingValue: FC<{ value: number }> = ({ value }) => (
  <span className={styles.rating}>
    <SvgStar size="16" fillPercent={100} />
    {value}
  </span>
);

const renderPlaythrough = (
  playthrough: ILogPlaythrough,
  gameLink: ReactNode,
  isLead: boolean
): ReactNode => {
  const { action, before, after } = playthrough;
  const phrase =
    action !== "removed" &&
    (action === "added" || isStatusChanged(before, after)) &&
    getStatusPhrase(after);
  const from = before?.category ?? "playthroughs";
  const sentence =
    action === "removed" ? (
      isLead ? (
        <>
          Removed {gameLink} from {from}
        </>
      ) : (
        `Removed from ${from}`
      )
    ) : phrase ? (
      isLead ? (
        <>
          {phrase[0]} {gameLink}
          {phrase[1] && ` ${phrase[1]}`}
        </>
      ) : (
        phrase.filter(Boolean).join(" ")
      )
    ) : action === "added" ? (
      isLead ? (
        <>Added {gameLink} to playthroughs</>
      ) : (
        "Added to playthroughs"
      )
    ) : isLead ? (
      <>Updated {gameLink}</>
    ) : (
      "Updated the playthrough"
    );
  const details = getPlaythroughDetails(playthrough);

  return (
    <>
      <span className={styles.sentence}>{sentence}</span>
      {details.some(Boolean) && (
        <span className={styles.details}>
          <StatusDetails items={details} />
        </span>
      )}
    </>
  );
};

const renderRating = (
  rating: ILogRating,
  gameLink: ReactNode,
  isLead: boolean
): ReactNode => (
  <span className={styles.sentence}>
    {rating.value !== null ? (
      <>
        {isLead ? <>Rated {gameLink}</> : "Rated"}{" "}
        <RatingValue value={rating.value} />
      </>
    ) : isLead ? (
      <>Removed rating of {gameLink}</>
    ) : (
      "Removed the rating"
    )}
  </span>
);

const renderFavorite = (
  favorite: boolean,
  gameLink: ReactNode,
  isLead: boolean
): ReactNode => (
  <span className={styles.sentence}>
    {favorite ? (
      isLead ? (
        <>Put {gameLink} in the top 10</>
      ) : (
        "Put in the top 10"
      )
    ) : isLead ? (
      <>Removed {gameLink} from the top 10</>
    ) : (
      "Removed from the top 10"
    )}
  </span>
);

const renderLogLines = (log: ILogChanges, game: IGameResponse) => {
  const gameLink = (
    <Link href={`/games/${game.slug}`} className={styles.game}>
      {game.name}
    </Link>
  );
  const { playthrough, rating, favorite } = log;
  const lines: ((isLead: boolean) => ReactNode)[] = [];

  if (playthrough) {
    lines.push((isLead) => renderPlaythrough(playthrough, gameLink, isLead));
  }
  if (rating) lines.push((isLead) => renderRating(rating, gameLink, isLead));
  if (favorite !== undefined) {
    lines.push((isLead) => renderFavorite(favorite, gameLink, isLead));
  }

  return lines.map((render, index) => render(index === 0));
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

  const handleDelete = (logId: string) => {
    const modalId = `delete-log-${logId}`;

    modal.open(
      <ConfirmModal
        title="Delete Log"
        message="Are you sure you want to delete this log entry?"
        onConfirm={() =>
          removeLog(
            { userId, _id: logId },
            {
              onSuccess: () => {
                modal.close(modalId);
                toast.success({ description: "Log deleted successfully" });
              },
            }
          )
        }
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
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
            <ol className={styles.timeline}>
              {logs.map((log, index) => {
                const date = new Date(log.date);
                const dayLabel = getDayLabel(date, now);
                const previous = logs[index - 1];
                const isNewDay =
                  !previous ||
                  getDayLabel(new Date(previous.date), now) !== dayLabel;
                const [lead, ...rest] = renderLogLines(log, log.game);

                if (!lead) return null;

                return (
                  <Fragment key={log._id}>
                    {isNewDay && (
                      <li className={styles.day} aria-hidden="true">
                        {dayLabel}
                      </li>
                    )}
                    <li
                      className={classNames(
                        styles.entry,
                        styles[`entry_${getLogTone(log)}`]
                      )}
                    >
                      <span className={styles.dot} aria-hidden="true" />
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
                          <Cover
                            isWithoutText
                            className={styles.cover__image}
                          />
                        )}
                      </Link>
                      <div className={styles.body}>
                        <div className={styles.line}>
                          {lead}
                        </div>
                        {rest.map((line, lineIndex) => (
                          <div
                            key={lineIndex}
                            className={classNames(
                              styles.line,
                              styles.line_secondary
                            )}
                          >
                            {line}
                          </div>
                        ))}
                      </div>
                      <div className={styles.side}>
                        <time className={styles.time} dateTime={log.date}>
                          {getTimeLabel(date, now)}
                        </time>
                        {isOwner && (
                          <button
                            type="button"
                            className={styles.delete}
                            aria-label="Delete log entry"
                            onClick={() => handleDelete(log._id)}
                          >
                            <SvgClose size="12" style={{ color: "inherit" }} />
                          </button>
                        )}
                      </div>
                    </li>
                  </Fragment>
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
