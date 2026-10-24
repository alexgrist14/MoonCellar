import { FC, useCallback, useEffect, useState } from "react";
import { IGameResponse, IReview, IReviewsResponse } from "@mooncellar/schemas";
import { Box } from "@/src/lib/shared/ui/Box";
import { modal } from "@/src/lib/shared/ui/Modal";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useReviewsQuery } from "@/src/lib/entities/comment/api/comment.queries";
import { CommentThread } from "@/src/lib/features/comments/ui/CommentThread";
import { GameReviews } from "@/src/lib/features/comments/ui/GameReviews";
import {
  PLAYTHROUGH_MODAL_ID,
  PlaythroughModal,
} from "@/src/lib/features/game/ui/PlaythroughModal";
import styles from "./GameCommunity.module.scss";

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

  const writeReview = (userId: string) =>
    modal.open(<PlaythroughModal game={game} userId={userId} isReview />, {
      id: PLAYTHROUGH_MODAL_ID,
      isResizable: true,
    });

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
        <GameReviews
          game={game}
          initialReviews={initialReviews}
          onDiscuss={discussReview}
          onWriteReview={writeReview}
        />
      </div>
      {isDiscussionOpened && (
        <div hidden={tabIndex !== DISCUSSION_TAB}>
          <CommentThread
            target={{ type: "game", id: game._id }}
            placeholder="Ask about a boss, a route or a build…"
            emptyTitle="No discussion yet. Start it with a question or a tip."
            discussedReview={discussedReview}
            onClearReview={clearDiscussedReview}
            onTotal={setDiscussionTotal}
          />
        </div>
      )}
    </Box>
  );
};
