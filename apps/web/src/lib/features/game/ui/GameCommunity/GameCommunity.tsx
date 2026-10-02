import { FC, useCallback, useEffect, useState } from "react";
import { IGameResponse, IReview, IReviewsResponse } from "@mooncellar/schemas";
import { Box } from "@/src/lib/shared/ui/Box";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useReviewsQuery } from "@/src/lib/entities/comment/api/comment.queries";
import styles from "./GameCommunity.module.scss";
import { ReviewsTab } from "./components/ReviewsTab";
import { DiscussionTab } from "./components/DiscussionTab";

interface IGameCommunityProps {
  game: IGameResponse;
  initialReviews?: IReviewsResponse;
}

const REVIEWS_TAB = 0;
const DISCUSSION_TAB = 1;
const COMMUNITY_ID = "community";
const TABS_BY_HASH: Record<string, number> = {
  "#reviews": REVIEWS_TAB,
  "#discussion": DISCUSSION_TAB,
};

export const GameCommunity: FC<IGameCommunityProps> = ({
  game,
  initialReviews,
}) => {
  const [tabIndex, setTabIndex] = useState(REVIEWS_TAB);
  const [isDiscussionOpened, setIsDiscussionOpened] = useState(false);
  const [discussionTotal, setDiscussionTotal] = useState<number>();
  const [discussedReview, setDiscussedReview] = useState<IReview>();

  const { data } = useReviewsQuery(
    game._id,
    "helpful",
    undefined,
    initialReviews
  );

  const reviewsTotal = data?.pages[0]?.summary.total ?? 0;

  const openTab = useCallback((index: number) => {
    setTabIndex(index);

    if (index === DISCUSSION_TAB) setIsDiscussionOpened(true);
  }, []);

  useEffect(() => {
    const openFromHash = () => {
      const tab = TABS_BY_HASH[window.location.hash];

      if (tab === undefined) return;

      openTab(tab);
      requestAnimationFrame(() =>
        document
          .getElementById(COMMUNITY_ID)
          ?.scrollIntoView({ behavior: "smooth", block: "start" })
      );
    };

    openFromHash();
    window.addEventListener("hashchange", openFromHash);

    return () => window.removeEventListener("hashchange", openFromHash);
  }, [openTab]);

  const discussReview = useCallback(
    (review: IReview) => {
      setDiscussedReview(review);
      openTab(DISCUSSION_TAB);
    },
    [openTab]
  );

  const clearDiscussedReview = useCallback(
    () => setDiscussedReview(undefined),
    []
  );

  return (
    <Box
      id={COMMUNITY_ID}
      contentStyle={{ padding: "var(--padding-x4)" }}
      classNameContent={styles.community}
    >
      <Tabs
        defaultTabIndex={tabIndex}
        isUseDefaultIndex
        contents={[
          {
            tabName: "Reviews",
            count: reviewsTotal,
            onTabClick: () => openTab(REVIEWS_TAB),
          },
          {
            tabName: "Discussion",
            count: discussionTotal,
            onTabClick: () => openTab(DISCUSSION_TAB),
          },
        ]}
      />
      <div hidden={tabIndex !== REVIEWS_TAB}>
        <ReviewsTab
          game={game}
          initialReviews={initialReviews}
          onDiscuss={discussReview}
        />
      </div>
      {isDiscussionOpened && (
        <div hidden={tabIndex !== DISCUSSION_TAB}>
          <DiscussionTab
            game={game}
            discussedReview={discussedReview}
            onClearReview={clearDiscussedReview}
            onTotal={setDiscussionTotal}
          />
        </div>
      )}
    </Box>
  );
};
