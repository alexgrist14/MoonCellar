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
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { modal } from "@/src/lib/shared/ui/Modal";
import {
  PLAYTHROUGH_MODAL_ID,
  PlaythroughModal,
} from "@/src/lib/features/game/ui/PlaythroughModal";
import { SvgComment, SvgPen } from "@/src/lib/shared/ui/svg";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import {
  flattenPages,
  useReviewsQuery,
} from "@/src/lib/entities/comment/api/comment.queries";
import { useReviewHelpfulMutation } from "@/src/lib/entities/comment/api/comment.mutations";
import styles from "@/src/lib/features/game/ui/GameCommunity/GameCommunity.module.scss";
import { useRequireAuth } from "@/src/lib/features/game/ui/GameCommunity/useRequireAuth";
import { ReviewItem } from "./ReviewItem";
import { ReviewsSummary } from "./ReviewsSummary";
import { Tabs } from "@/src/lib/shared/ui/Tabs";

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
        { id: PLAYTHROUGH_MODAL_ID, isResizable: true }
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
      onClick={openReviewModal}
    >
      <SvgPen size="16" style={{ color: "inherit" }} />
      Write a review
    </Button>
  );

  if (isLoaderShown && !summary) {
    return <Loader type="pulse" isBlock />;
  }

  if (!summary?.total) {
    return (
      <EmptyState
        variant="inline"
        icon={<SvgComment size="24" color="secondary" />}
        title={`No reviews for ${game.name} yet`}
        description="Finished it or dropped it? Your playthrough note can be the first one here."
        action={writeButton}
      />
    );
  }

  return (
    <div className={styles.tab}>
      <ReviewsSummary summary={summary} />
      <div className={styles.toolbar}>
        <Tabs
          theme="segmented"
          ariaLabel="Filter reviews by status"
          isWrap
          contents={[
            {
              tabName: "All",
              count: summary.total,
              onTabClick: () => setCategory(undefined),
            },
            ...summary.categories.map(({ category: item, count }) => ({
              tabName: commonUtils.upFL(item),
              count,
              prefix: (
                <i className={classNames(styles.dot, styles[`dot_${item}`])} />
              ),
              onTabClick: () => setCategory(item),
            })),
          ]}
          defaultTabIndex={
            category
              ? summary.categories.findIndex(
                  (item) => item.category === category
                ) + 1
              : 0
          }
          isUseDefaultIndex
        />
        <Tabs
          theme="segmented"
          ariaLabel="Sort reviews"
          contents={sortOptions.map((option) => ({
            tabName: option.label,
            onTabClick: () => setSort(option.value),
          }))}
          defaultTabIndex={sortOptions.findIndex(
            (option) => option.value === sort
          )}
          isUseDefaultIndex
        />
      </div>
      {isLoaderShown ? (
        <Loader type="pulse" isBlock />
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
