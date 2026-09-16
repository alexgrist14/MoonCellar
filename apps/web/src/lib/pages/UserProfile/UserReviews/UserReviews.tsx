import { FC, useEffect, useMemo, useState } from "react";
import classNames from "classnames";
import { useDebouncedCallback } from "use-debounce";
import {
  IGetUserReviewsRequest,
  IUserReview,
  IUserReviewsOrder,
  IUserReviewsSort,
  IUserReviewStatus,
  USER_REVIEWS_PAGE_SIZE,
} from "@mooncellar/schemas";
import { useUserReviewsQuery } from "@/src/lib/entities/comment/api/comment.queries";
import { useUserReviewHelpfulMutation } from "@/src/lib/entities/comment/api/comment.mutations";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useMinimumLoading } from "@/src/lib/shared/hooks/useMinimumLoading";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { IRangeValue, RangeSelector } from "@/src/lib/shared/ui/RangeSelector";
import { ReviewSortType } from "@/src/lib/shared/types/sort.type";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { UserReviewItem } from "./UserReviewItem";
import styles from "./UserReviews.module.scss";

const ALL_GAMES = "All games";
const MIN_RATING = 1;
const MAX_RATING = 10;
const RATING_DEBOUNCE = 400;

const REVIEW_SORT_VALUES: Record<ReviewSortType, IUserReviewsSort> = {
  [ReviewSortType.DATE]: "date",
  [ReviewSortType.RATING]: "rating",
  [ReviewSortType.HELPFUL]: "helpful",
};

interface IUserReviewsProps {
  userId: string;
  userName: string;
  isOwnProfile: boolean;
  sort: ReviewSortType;
  order: IUserReviewsOrder;
}

export const UserReviews: FC<IUserReviewsProps> = ({
  userId,
  userName,
  isOwnProfile,
  sort,
  order,
}) => {
  const [status, setStatus] = useState<IUserReviewStatus>();
  const [gameIds, setGameIds] = useState<string[]>([]);
  const [ratingMin, setRatingMin] = useState<number>();
  const [ratingMax, setRatingMax] = useState<number>();
  const [rating, setRating] = useState<IRangeValue>([MIN_RATING, MAX_RATING]);
  const [page, setPage] = useState(1);

  const isRatingFiltered = ratingMin !== undefined || ratingMax !== undefined;

  const applyRating = useDebouncedCallback(([from, to]: IRangeValue) => {
    setRatingMin(from === MIN_RATING ? undefined : from);
    setRatingMax(to === MAX_RATING ? undefined : to);
  }, RATING_DEBOUNCE);

  useEffect(() => applyRating(rating), [rating, applyRating]);

  const params: IGetUserReviewsRequest = useMemo(
    () => ({
      sort: REVIEW_SORT_VALUES[sort],
      order,
      status,
      ...(!!gameIds.length && { gameIds }),
      ratingMin,
      ratingMax,
      page,
      take: USER_REVIEWS_PAGE_SIZE,
    }),
    [sort, order, status, gameIds, ratingMin, ratingMax, page]
  );

  const { data, isLoading, isFetching } = useUserReviewsQuery(userId, params);
  const { mutate: setHelpful } = useUserReviewHelpfulMutation(userId);

  const isLoaderShown = useMinimumLoading(isLoading);

  const reviews = useMemo(() => data?.results ?? [], [data?.results]);
  const summary = data?.summary;

  const games = useMemo(() => data?.games ?? [], [data?.games]);

  const pageGameIds = useMemo(
    () => [...new Set(reviews.map((review) => review.gameId))],
    [reviews]
  );

  const { data: pageGames = [], isFetching: isGamesFetching } =
    useGamesByIdsQuery(pageGameIds);

  const gameCards = useMemo(
    () => new Map(pageGames.map((game) => [game._id, game])),
    [pageGames]
  );

  const isRefreshing =
    useMinimumLoading(isFetching || isGamesFetching) && !isLoaderShown;

  const gameNames = useMemo(() => games.map((game) => game.name), [games]);

  useEffect(
    () => setPage(1),
    [sort, order, status, gameIds, ratingMin, ratingMax]
  );

  const toggleHelpful = (review: IUserReview) =>
    setHelpful({ reviewId: review._id, isHelpful: !review.isHelpful });

  if (isLoaderShown) return <Loader type="moon" />;

  if (!summary?.total) {
    return (
      <EmptyState
        title="No reviews yet"
        description={
          isOwnProfile
            ? "Notes you publish from a playthrough show up here and on the game's page"
            : `${userName} has not published any reviews yet`
        }
      />
    );
  }

  return (
    <div className={styles.reviews}>
      <div className={styles.reviews__head}>
        <p className={styles.reviews__total}>
          {summary.total} {commonUtils.addLastS("review", summary.total)}
          {summary.averageRating !== null && (
            <span className={styles.reviews__average}>
              {" "}
              · {summary.averageRating} average of {summary.ratedCount} rated
            </span>
          )}
        </p>
      </div>

      <div className={styles.filters}>
        <div className={styles.filters__game}>
          <Dropdown
            list={gameNames}
            placeholder={ALL_GAMES}
            overwriteValue={
              gameIds.length
                ? `${gameIds.length} of ${games.length} ${commonUtils.addLastS("game", games.length)}`
                : ALL_GAMES
            }
            isMulti
            isWithReset
            isThroughPortal
            getIndexes={(indexes) =>
              setGameIds(
                indexes.flatMap((index) =>
                  games[index] ? [games[index]._id] : []
                )
              )
            }
          />
        </div>
        <div className={styles.filters__rating}>
          <RangeSelector
            isDual
            isWithValue
            min={MIN_RATING}
            max={MAX_RATING}
            text={
              isRatingFiltered
                ? `Rating ${ratingMin ?? MIN_RATING}–${ratingMax ?? MAX_RATING}`
                : "Any rating"
            }
            defaultValue={rating}
            callback={setRating}
          />
        </div>
      </div>

      <div className={styles.chips} role="group" aria-label="Filter by status">
        <button
          type="button"
          aria-pressed={!status}
          className={classNames(styles.chip, {
            [styles.chip_active]: !status,
          })}
          onClick={() => setStatus(undefined)}
        >
          All <span className={styles.chip__count}>{summary.total}</span>
        </button>
        {summary.statuses.map(({ status: item, count }) => (
          <button
            key={item}
            type="button"
            aria-pressed={status === item}
            className={classNames(styles.chip, {
              [styles.chip_active]: status === item,
            })}
            onClick={() => setStatus(item)}
          >
            <i className={classNames(styles.dot, styles[`dot_${item}`])} />
            {commonUtils.upFL(item)}{" "}
            <span className={styles.chip__count}>{count}</span>
          </button>
        ))}
      </div>

      <div
        className={classNames(styles.results, {
          [styles.busy]: isRefreshing,
        })}
        aria-busy={isRefreshing}
      >
        {isRefreshing && (
          <Loader type="pulse" className={styles.busy__loader} />
        )}
        {!reviews.length ? (
          <EmptyState
            title="Nothing found"
            description="No reviews match the selected filters"
          />
        ) : (
          <div className={styles.feed}>
            {reviews.map((review) => (
              <UserReviewItem
                key={review._id}
                review={review}
                gameCard={gameCards.get(review.gameId)}
                isOwnProfile={isOwnProfile}
                onHelpful={toggleHelpful}
              />
            ))}
          </div>
        )}
      </div>

      <Pagination
        take={USER_REVIEWS_PAGE_SIZE}
        total={data?.total ?? 0}
        page={page}
        isFixed
        isDisabled={isRefreshing}
        onPageChange={setPage}
      />
    </div>
  );
};
