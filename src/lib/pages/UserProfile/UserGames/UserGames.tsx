import { SortType } from "@/src/lib/shared/types/sort.type";
import { CategoriesFilterType } from "@/src/lib/shared/types/user.type";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { FC, useMemo } from "react";
import styles from "./UserGames.module.scss";
import { useSearchParams } from "next/navigation";
import { IPlaythrough } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { modal } from "@/src/lib/shared/ui/Modal";
import { GamePlaysInfo } from "@/src/lib/entities/game/ui/GamePlaysInfo";
import { IUserRating } from "@/src/lib/shared/lib/schemas/user-ratings.schema";
import { GamesCards } from "@/src/lib/shared/ui/GamesCards";
import { takeGames } from "@/src/lib/shared/constants/games.const";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button } from "@/src/lib/shared/ui/Button";
import { RatingStars } from "@/src/lib/shared/ui/RatingStars";
import { SvgComment } from "@/src/lib/shared/ui/svg";
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";

interface UserGamesProps {
  playthroughs: IPlaythrough[];
  ratings: IUserRating[];
  selectedSort: SortType;
  sortOrder: string;
}

export const UserGames: FC<UserGamesProps> = ({
  playthroughs,
  ratings,
  selectedSort,
  sortOrder,
}) => {
  const query = useSearchParams();
  const page = Number(query.get("page"));
  const list = query.get("list") as CategoriesFilterType;

  const parsedGamesRatings = useMemo(() => {
    return ratings?.reduce(
      (res: { [key: string]: number | null }, rating) => ({
        ...res,
        [rating.gameId]: rating.rating,
      }),
      {}
    );
  }, [ratings]);

  const playthroughsCountByGame = useMemo(() => {
    return playthroughs?.reduce((res: { [key: string]: number }, play) => {
      res[play.gameId] = (res[play.gameId] || 0) + 1;
      return res;
    }, {});
  }, [playthroughs]);

  const commentsCountByGame = useMemo(() => {
    return playthroughs?.reduce((res: { [key: string]: number }, play) => {
      if (!!play.comment) res[play.gameId] = (res[play.gameId] || 0) + 1;
      return res;
    }, {});
  }, [playthroughs]);

  const gameIds = useMemo(() => {
    const plays = playthroughs
      ?.filter(
        (play) =>
          list === "all" ||
          (play.category === list && !play.isMastered) ||
          (list === "mastered" && play.isMastered)
      )
      .reduce((res: IPlaythrough[], play) => {
        let existed = res.find((item) => item.gameId === play.gameId);
        if (!!existed) {
          new Date(existed.updatedAt).getTime() <
            new Date(play.updatedAt).getTime() && (existed = play);
        } else {
          res.push(play);
        }

        return res;
      }, []);

    switch (selectedSort) {
      case SortType.RATING:
        plays?.sort((a, b) => {
          const ratingA = parsedGamesRatings[a.gameId] || 0;
          const ratingB = parsedGamesRatings[b.gameId] || 0;

          if (!ratingB || !ratingA) return ratingA < ratingB ? 1 : -1;

          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      case SortType.DATE_ADDED:
        plays?.sort((a, b) => {
          const dateA = !!a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = !!b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        break;
      case SortType.PLAYTHROUGHS:
        plays?.sort((a, b) => {
          const countA = playthroughsCountByGame[a.gameId] || 0;
          const countB = playthroughsCountByGame[b.gameId] || 0;

          return sortOrder === "asc" ? countA - countB : countB - countA;
        });
        break;
      case SortType.COMMENTS:
        plays?.sort((a, b) => {
          const countA = commentsCountByGame[a.gameId] || 0;
          const countB = commentsCountByGame[b.gameId] || 0;

          return sortOrder === "asc" ? countA - countB : countB - countA;
        });
        break;
    }
    return plays.filter((play) => !!play.gameId).map((play) => play.gameId);
  }, [
    commentsCountByGame,
    list,
    parsedGamesRatings,
    playthroughs,
    playthroughsCountByGame,
    selectedSort,
    sortOrder,
  ]);

  const currentPage = page || 1;

  const pageGameIds = useMemo(
    () => gameIds.slice((currentPage - 1) * takeGames, currentPage * takeGames),
    [gameIds, currentPage]
  );

  const {
    data: games = [],
    isPending,
    isFetching,
  } = useGamesByIdsQuery(pageGameIds);

  const total = gameIds.length;

  if (!pageGameIds.length)
    return (
      <EmptyState
        title="List is empty"
        description="There are no games in this list yet"
      />
    );
  if (isPending || isFetching) return <Loader type="moon" />;

  return (
    <>
      <GamesCards
        games={games}
        gameClassName={styles.games__game}
        additionalHeight={100}
        additionalGameNode={(game) => {
          const rating = parsedGamesRatings?.[game._id];
          const gamePlaythroughs = playthroughs.filter(
            (play) => play.gameId === game._id
          );
          const hasComment = gamePlaythroughs.some((play) => !!play.comment);
          const hideGamePlaysInfo =
            gamePlaythroughs.length === 1 &&
            (gamePlaythroughs[0].category === "wishlist" ||
              gamePlaythroughs[0].category === "playing");

          return (
            <Box
              wrapperStyle={{
                height: "fit-content",
                width: "90%",
                justifySelf: "center",
              }}
              classNameContent={styles.games__info}
              contentStyle={{ padding: "var(--padding-x2)" }}
            >
              {!!rating && (
                <RatingStars
                  rating={rating}
                  size="12"
                  className={styles.games__stars}
                />
              )}
              <p className={styles.games__title}>{game.name}</p>
              {!hideGamePlaysInfo && (
                <>
                  <Button
                    className={styles.games__plays}
                    onClick={() =>
                      modal.open(
                        <GamePlaysInfo
                          gameName={game.name}
                          playthroughs={gamePlaythroughs}
                        />
                      )
                    }
                  >
                    <p>
                      {gamePlaythroughs.length}{" "}
                      {commonUtils.addLastS(
                        "Playthrough",
                        gamePlaythroughs.length
                      )}
                    </p>
                    {hasComment && (
                      <SvgComment size="12" className={styles.games__comment} />
                    )}
                  </Button>
                </>
              )}
            </Box>
          );
        }}
      />
      <Pagination
        take={takeGames}
        total={total}
        isFixed
        isDisabled={isFetching}
      />
    </>
  );
};
