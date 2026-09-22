import { FC } from "react";
import classNames from "classnames";
import Link from "next/link";
import { IGameResponse, IUserReview } from "@mooncellar/schemas";
import { AuthorStatus } from "@/src/lib/shared/ui/AuthorStatus";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { ExpandableBlock } from "@/src/lib/shared/ui/ExpandableBlock";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { RichText } from "@/src/lib/shared/ui/RichText";
import { Spoiler } from "@/src/lib/shared/ui/Spoiler";
import { SvgThumb } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./UserReviews.module.scss";

const formatIsoDate = (date: string) => {
  const [year, month, day] = date.split("-");

  return `${day}.${month}.${year}`;
};

interface IUserReviewItemProps {
  review: IUserReview;
  gameCard?: IGameResponse;
  isOwnProfile: boolean;
  onHelpful: (review: IUserReview) => void;
}

export const UserReviewItem: FC<IUserReviewItemProps> = ({
  review,
  gameCard,
  isOwnProfile,
  onHelpful,
}) => {
  const { game } = review;
  const href = game?.slug ? `/games/${game.slug}` : undefined;

  const meta = [review.platformName, !!review.time && `${review.time} h`]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className={styles.item}>
      <div className={styles.item__card}>
        {!!gameCard ? (
          <GameCard game={gameCard} />
        ) : (
          <Cover className={styles.item__placeholder} isWithoutText />
        )}
      </div>
      <div className={styles.item__main}>
        <div className={styles.item__head}>
          {!!href ? (
            <Link href={href} className={styles.item__game}>
              {game?.name}
            </Link>
          ) : (
            <span className={styles.item__game}>Unknown game</span>
          )}
          <AuthorStatus
            category={review.category}
            isMastered={review.isMastered}
          />
          {!!meta && <span className={styles.item__meta}>{meta}</span>}
          {review.isSpoiler && (
            <span className={styles.item__flag}>Spoilers</span>
          )}
          {isOwnProfile && !review.isPublic && (
            <span
              className={classNames(styles.item__flag, styles.item__flag_muted)}
              title="Not shown on the game page"
            >
              Not published
            </span>
          )}
          {review.rating !== null && (
            <span className={styles.item__score}>
              {review.rating}
              <span className={styles.item__scale}> / 10</span>
            </span>
          )}
        </div>
        <Spoiler isActive={review.isSpoiler}>
          <ExpandableBlock
            clampHeight="var(--community-review-clamp-height)"
            title={game?.name ?? "Review"}
            mode="drawer"
          >
            <RichText content={review.comment} className={styles.item__body} />
          </ExpandableBlock>
        </Spoiler>
        <div className={styles.item__actions}>
          {!!review.isPublic &&
            (isOwnProfile ? (
              <span className={styles.item__helpful}>
                <SvgThumb size="16" style={{ color: "inherit" }} />
                Helpful
                <span className={styles.item__count}>
                  {review.helpfulCount}
                </span>
              </span>
            ) : (
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
                <span className={styles.item__count}>
                  {review.helpfulCount}
                </span>
              </button>
            ))}
          {review.date ? (
            <span className={classNames(styles.item__meta, styles.item__date)}>
              Finished {formatIsoDate(review.date)}
            </span>
          ) : (
            <time
              dateTime={review.updatedAt}
              className={classNames(styles.item__meta, styles.item__date)}
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
