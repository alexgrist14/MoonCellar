import { FC, Fragment, ReactNode, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import classNames from "classnames";
import { IGameResponse, ILogSegment } from "@mooncellar/schemas";
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
import { RichText } from "@/src/lib/shared/ui/RichText";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { StatusBadge, StatusDetails } from "@/src/lib/shared/ui/StatusBadge";
import { SvgClose, SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  EMPTY_VALUE,
  formatHours,
  getDayLabel,
  getSegmentTone,
  getTimeLabel,
} from "./activity.utils";
import styles from "./ActivityTimeline.module.scss";

interface IActivityTimelineProps {
  userId: string;
  isOwner: boolean;
}

const ADDED_TEMPLATES: Record<string, [string, string]> = {
  completed: ["Completed", ""],
  mastered: ["Mastered", ""],
  played: ["Played", ""],
  dropped: ["Dropped", ""],
  playing: ["Started playing", ""],
  backlog: ["Added", "to the backlog"],
  wishlist: ["Wishlisted", ""],
};

const ADDED_SHORT: Record<string, string> = {
  completed: "Completed",
  mastered: "Mastered",
  played: "Played",
  dropped: "Dropped",
  playing: "Started playing",
  backlog: "Added to the backlog",
  wishlist: "Wishlisted",
};

const renderDetails = (segment: ILogSegment, isWithStatus: boolean) => {
  const hours = formatHours(segment.time);
  const isStatusShown = isWithStatus && !!segment.status;
  const details = [
    segment.console &&
      (segment.console === EMPTY_VALUE
        ? `Platform ${EMPTY_VALUE}`
        : segment.console),
    hours && (hours === EMPTY_VALUE ? `Time ${EMPTY_VALUE}` : hours),
    segment.date &&
      (segment.date === EMPTY_VALUE ? `Date ${EMPTY_VALUE}` : segment.date),
  ];

  if (!isStatusShown && !details.some(Boolean)) return null;

  return (
    <span className={styles.details}>
      {isStatusShown && (
        <StatusBadge status={segment.status}>
          {segment.status === EMPTY_VALUE ? `Status ${EMPTY_VALUE}` : undefined}
        </StatusBadge>
      )}
      <StatusDetails items={details} />
    </span>
  );
};

const RatingValue: FC<{ value: number }> = ({ value }) => (
  <span className={styles.rating}>
    <SvgStar size="16" fillPercent={100} />
    {value}
  </span>
);

const renderSegment = (
  segment: ILogSegment,
  game: IGameResponse,
  isLead: boolean
): ReactNode => {
  const gameLink = (
    <Link href={`/games/${game.slug}`} className={styles.game}>
      {game.name}
    </Link>
  );
  const category = segment.status?.trim().toLowerCase() ?? "";

  switch (segment.kind) {
    case "added": {
      const template = ADDED_TEMPLATES[category];

      return (
        <>
          <span className={styles.sentence}>
            {isLead ? (
              template ? (
                <>
                  {template[0]} {gameLink}
                  {template[1] && ` ${template[1]}`}
                </>
              ) : (
                <>Added {gameLink} to playthroughs</>
              )
            ) : (
              (ADDED_SHORT[category] ?? "Added to playthroughs")
            )}
          </span>
          {renderDetails(segment, false)}
        </>
      );
    }
    case "updated":
      return (
        <>
          <span className={styles.sentence}>
            {isLead ? <>Updated {gameLink}</> : "Updated the playthrough"}
          </span>
          {renderDetails(segment, true)}
        </>
      );
    case "removed": {
      const from = segment.status ? category : "playthroughs";

      return (
        <span className={styles.sentence}>
          {isLead ? (
            <>
              Removed {gameLink} from {from}
            </>
          ) : (
            `Removed from ${from}`
          )}
        </span>
      );
    }
    case "rating":
      return (
        <span className={styles.sentence}>
          {segment.rating !== undefined ? (
            <>
              {isLead ? <>Rated {gameLink}</> : "Rated"}{" "}
              <RatingValue value={segment.rating} />
            </>
          ) : isLead ? (
            <>Removed rating of {gameLink}</>
          ) : (
            "Removed the rating"
          )}
        </span>
      );
    case "favorite":
      return (
        <span className={styles.sentence}>
          {segment.isRemoval ? (
            isLead ? (
              <>Removed {gameLink} from the top 10</>
            ) : (
              "Removed from the top 10"
            )
          ) : isLead ? (
            <>Put {gameLink} in the top 10</>
          ) : (
            "Put in the top 10"
          )}
        </span>
      );
    default:
      return (
        <>
          {isLead && gameLink}
          <RichText content={segment.html} className={styles.legacy} />
        </>
      );
  }
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
                const segments = log.segments?.length
                  ? log.segments
                  : [
                      {
                        kind: "legacy",
                        title: "",
                        html: log.text,
                      } satisfies ILogSegment,
                    ];
                const [lead, ...rest] = segments;

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
                        styles[`entry_${getSegmentTone(lead)}`]
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
                          {renderSegment(lead, log.game, true)}
                        </div>
                        {rest.map((segment, segmentIndex) => (
                          <div
                            key={segmentIndex}
                            className={classNames(
                              styles.line,
                              styles.line_secondary
                            )}
                          >
                            {renderSegment(segment, log.game, false)}
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
