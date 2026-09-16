import { FC } from "react";
import classNames from "classnames";
import { IReview } from "@mooncellar/schemas";
import { RichText } from "@/src/lib/shared/ui/RichText/RichText";
import { Spoiler } from "@/src/lib/shared/ui/Spoiler";
import { ExpandableBlock } from "@/src/lib/shared/ui/ExpandableBlock/ExpandableBlock";
import { SvgReply, SvgThumb } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "../GameCommunity.module.scss";
import { AuthorName, CommunityAvatar } from "./CommunityAuthor";
import { AuthorStatus } from "@/src/lib/shared/ui/AuthorStatus";

interface IReviewItemProps {
  review: IReview;
  onHelpful: (review: IReview) => void;
  onDiscuss: (review: IReview) => void;
}

const formatIsoDate = (date: string) => {
  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
};

export const ReviewItem: FC<IReviewItemProps> = ({
  review,
  onHelpful,
  onDiscuss,
}) => {
  const meta = [review.platformName, !!review.time && `${review.time} h`]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.entry}>
      <CommunityAvatar author={review.author} />
      <div className={styles.entry__main}>
        <div className={styles.entry__head}>
          <AuthorName author={review.author} />
          <AuthorStatus
            category={review.category}
            isMastered={review.isMastered}
          />
          {!!meta && <span className={styles.entry__meta}>{meta}</span>}
          {review.isSpoiler && (
            <span className={styles.entry__spoiler}>Spoilers</span>
          )}
          {review.rating !== null && (
            <span className={styles.entry__score}>
              {review.rating}
              <span className={styles.entry__scale}> / 10</span>
            </span>
          )}
        </div>
        <Spoiler isActive={review.isSpoiler}>
          <ExpandableBlock
            clampHeight="var(--community-review-clamp-height)"
            title={`${review.author?.userName ?? "Player"}'s review`}
            mode="drawer"
          >
            <RichText content={review.comment} className={styles.entry__body} />
          </ExpandableBlock>
        </Spoiler>
        <div className={styles.entry__actions}>
          <button
            type="button"
            aria-pressed={review.isHelpful}
            className={classNames(styles.action, {
              [styles.action_active]: review.isHelpful,
            })}
            onClick={() => onHelpful(review)}
          >
            <SvgThumb size="16" style={{ color: "inherit" }} />
            Helpful
            <span className={styles.action__count}>{review.helpfulCount}</span>
          </button>
          <button
            type="button"
            className={styles.action}
            onClick={() => onDiscuss(review)}
          >
            <SvgReply size="16" style={{ color: "inherit" }} />
            Discuss
          </button>
          {review.date ? (
            <span
              className={classNames(styles.entry__meta, styles.entry__date)}
            >
              Finished {formatIsoDate(review.date)}
            </span>
          ) : (
            <time
              dateTime={review.updatedAt}
              className={classNames(styles.entry__meta, styles.entry__date)}
              suppressHydrationWarning
            >
              Updated {commonUtils.getHumanDate(review.updatedAt)}
            </time>
          )}
        </div>
      </div>
    </article>
  );
};
