import { FC, useState } from "react";
import classNames from "classnames";
import {
  IGameResponse,
  IReview,
  IReviewCategory,
  IReviewsResponse,
  IReviewsSort,
} from "@mooncellar/schemas";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { modal } from "@/src/lib/shared/ui/Modal";
import { PlaythroughModal } from "@/src/lib/shared/ui/PlaythroughModal";
import { SvgComment, SvgPen } from "@/src/lib/shared/ui/svg";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  flattenPages,
  useReviewsQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import { useReviewHelpfulMutation } from "@/src/lib/entities/comment/api/comment.mutations";
import styles from "../GameCommunity.module.scss";
import { useRequireAuth } from "../useRequireAuth";
import { ReviewItem } from "./ReviewItem";
import { ReviewsSummary } from "./ReviewsSummary";
import { SortToggle } from "./SortToggle";

interface IReviewsTabProps {
  game: IGameResponse;
  initialReviews?: IReviewsResponse;
  onDiscuss: (review: IReview) => void;
}

const sortOptions: { value: IReviewsSort; label: string }[] = [
  { value: "helpful", label: "Most helpful" },
  { value: "new", label: "Newest" },
];

export const ReviewsTab: FC<IReviewsTabProps> = ({
  game,
  initialReviews,
  onDiscuss,
}) => {
  const requireAuth = useRequireAuth();

  const [sort, setSort] = useState<IReviewsSort>("helpful");
  const [category, setCategory] = useState<IReviewCategory>();

  const isDefaultQuery = sort === "helpful" && !category;

  const { data, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage } =
    useReviewsQuery(
      game._id,
      sort,
      category,
      isDefaultQuery ? initialReviews : undefined
    );
  const { mutate: setHelpful } = useReviewHelpfulMutation(game._id);

  const isLoaderShown = useMinimumLoading(isLoading);
  const reviews = flattenPages(data?.pages);
  const summary = data?.pages[0]?.summary ?? initialReviews?.summary;

  const openReviewModal = () =>
    requireAuth((profile) =>
      modal.open(
        <PlaythroughModal game={game} userId={profile._id} isReview />,
        { id: "game-playthroughs", isResizable: true }
      )
    );

  const toggleHelpful = (review: IReview) =>
    requireAuth((profile) => {
      if (profile._id === review.userId) {
        toast.error({
          title: "Not available",
          description: "You can't mark your own review as helpful",
        });
        return;
      }

      setHelpful({ reviewId: review._id, isHelpful: !review.isHelpful });
    });

  const writeButton = (
    <Button
      color={ButtonColor.ACCENT}
      className={styles.iconButton}
      onClick={openReviewModal}
    >
      <SvgPen size="16" style={{ color: "inherit" }} />
      Write a review
    </Button>
  );

  if (isLoaderShown && !summary) {
    return (
      <div className={styles.loading}>
        <Loader type="pulse" />
      </div>
    );
  }

  if (!summary?.total) {
    return (
      <div className={styles.empty}>
        <SvgComment size="24" color="secondary" />
        <div className={styles.empty__text}>
          <p className={styles.empty__title}>No reviews for {game.name} yet</p>
          <p className={styles.empty__description}>
            Finished it, dropped it or still playing? Your playthrough note can
            be the first one here.
          </p>
        </div>
        {writeButton}
      </div>
    );
  }

  return (
    <div className={styles.tab}>
      <ReviewsSummary summary={summary} />
      <div className={styles.toolbar}>
        <div
          className={styles.chips}
          role="group"
          aria-label="Filter reviews by status"
        >
          <button
            type="button"
            aria-pressed={!category}
            className={classNames(styles.chip, {
              [styles.chip_active]: !category,
            })}
            onClick={() => setCategory(undefined)}
          >
            All <span className={styles.count}>{summary.total}</span>
          </button>
          {summary.categories.map(({ category: item, count }) => (
            <button
              key={item}
              type="button"
              aria-pressed={category === item}
              className={classNames(styles.chip, {
                [styles.chip_active]: category === item,
              })}
              onClick={() => setCategory(item)}
            >
              <i className={classNames(styles.dot, styles[`dot_${item}`])} />
              {commonUtils.upFL(item)}{" "}
              <span className={styles.count}>{count}</span>
            </button>
          ))}
        </div>
        <SortToggle
          label="Sort reviews"
          value={sort}
          options={sortOptions}
          onChange={setSort}
        />
      </div>
      {isLoaderShown ? (
        <div className={styles.loading}>
          <Loader type="pulse" />
        </div>
      ) : (
        <div className={styles.feed}>
          {reviews.map((review) => (
            <ReviewItem
              key={review._id}
              review={review}
              onHelpful={toggleHelpful}
              onDiscuss={onDiscuss}
            />
          ))}
        </div>
      )}
      <div className={styles.footer}>
        {hasNextPage ? (
          <Button
            color={ButtonColor.DEFAULT}
            disabled={isFetchingNextPage}
            onClick={() => fetchNextPage()}
          >
            Show more reviews
          </Button>
        ) : (
          <span />
        )}
        {writeButton}
      </div>
    </div>
  );
};
