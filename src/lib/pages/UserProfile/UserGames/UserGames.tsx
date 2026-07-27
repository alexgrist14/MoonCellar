import { gamesApi } from "@/src/lib/shared/api";
import { SortType } from "@/src/lib/shared/types/sort.type";
import { CategoriesFilterType } from "@/src/lib/shared/types/user.type";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { FC, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./UserGames.module.scss";
import { useSearchParams } from "next/navigation";
import { IPlaythrough } from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useDebouncedCallback } from "use-debounce";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { modal } from "@/src/lib/shared/ui/Modal";
import { GamePlaysInfo } from "@/src/lib/entities/game/ui/GamePlaysInfo";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { IUserRating } from "@/src/lib/shared/lib/schemas/user-ratings.schema";
import { GamesCards } from "@/src/lib/shared/ui/GamesCards";
import { takeGames } from "@/src/lib/shared/constants/games.const";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { RatingStars } from "@/src/lib/shared/ui/RatingStars";
import { SvgComment } from "@/src/lib/shared/ui/svg";

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
  const { sync, isLoading, setIsLoading } = useAsyncLoader();

  const query = useSearchParams();
  const page = Number(query.get("page"));
  const list = query.get("list") as CategoriesFilterType;

  const [total, setTotal] = useState(0);
  const [games, setGames] = useState<IGameResponse[]>();
  const [hasInitiallyLoaded, setHasInitiallyLoaded] = useState(false);

  const parsedGamesRatings = useMemo(() => {
    return ratings?.reduce(
      (res: { [key: string]: number | null }, rating) => ({
        ...res,
        [rating.gameId]: rating.rating,
      }),
      {}
    );
  }, [ratings]);

  const getGamesIds = useCallback(() => {
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

    setTotal(plays.length);

    switch (selectedSort) {
      case SortType.RATING:
        plays?.sort((a, b) => {
          const ratingA = parsedGamesRatings[a.gameId] || 0;
          const ratingB = parsedGamesRatings[b.gameId] || 0;

          if (!ratingB || !ratingA) return ratingA < ratingB ? 1 : -1;

          return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
        });
        break;
      // case SortType.TITLE:
      //   plays?.sort((a, b) => {
      //     const nameA = a.name.toLowerCase();
      //     const nameB = b.name.toLowerCase();
      //     return sortOrder === "asc"
      //       ? nameA.localeCompare(nameB)
      //       : nameB.localeCompare(nameA);
      //   });
      //   break;
      case SortType.DATE_ADDED:
        plays?.sort((a, b) => {
          const dateA = !!a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
          const dateB = !!b.updatedAt ? new Date(b.updatedAt).getTime() : 0;

          return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
        });
        break;
      // case SortType.DATE_COMPLETED:
      //   plays?.sort((a, b) => {
      //     const dateA = !!a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      //     const dateB = !!b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      //
      //     return sortOrder === "asc" ? dateA - dateB : dateB - dateA;
      //   });
      //   break;
    }

    return plays.filter((play) => !!play.gameId).map((play) => play.gameId);
  }, [list, playthroughs, parsedGamesRatings, selectedSort, sortOrder]);

  const debouncedGetGames = useDebouncedCallback((page: number = 1) => {
    const _ids = getGamesIds().slice((page - 1) * takeGames, page * takeGames);

    if (!_ids?.length) {
      setGames([]);
      setHasInitiallyLoaded(true);
      return;
    }

    sync(() =>
      gamesApi
        .getByIds({
          _ids,
        })
        .then((res) => {
          setGames(
            _ids.reduce((result: IGameResponse[], id) => {
              const game = res.data.find((game) => game._id === id);
              !!game && result.push(game);
              return result;
            }, [])
          );
          setHasInitiallyLoaded(true);
        })
    );
  }, 200);

  useEffect(() => {
    setGames(undefined);
    setHasInitiallyLoaded(false);
  }, [list]);

  useEffect(() => {
    !games && debouncedGetGames(page);
  }, [debouncedGetGames, page, games]);

  useEffect(() => {
    debouncedGetGames(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSort, sortOrder]);

  if (isLoading || !hasInitiallyLoaded) return <Loader type="moon" />;
  if (!games || games.length === 0) return <p>There is no games</p>;

  return (
    <>
      <GamesCards
        games={games}
        gameClassName={styles.games__game}
        additionalHeight={132}
        additionalGameNode={(game) => {
          const rating = parsedGamesRatings?.[game._id];
          const gamePlaythroughs = playthroughs.filter(
            (play) => play.gameId === game._id
          );
          const hasComment = gamePlaythroughs.some((play) => !!play.comment);

          return (
            <Box
              wrapperStyle={{
                height: "80%",
                width: "90%",
                justifySelf: "center",
              }}
              templateStyle={{ height: "100%" }}
              classNameContent={styles.games__info}
              contentStyle={{ padding: "var(--padding-x2)", height: "100%" }}
            >
              {!!rating && (
                <RatingStars
                  rating={rating}
                  size="12"
                  className={styles.games__stars}
                />
              )}
              <p className={styles.games__title}>{game.name}</p>
              <div className={styles.games__plays}>
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
              </div>
              <Button
                compact
                color={ButtonColor.DEFAULT}
                className={styles.games__button}
                onClick={() =>
                  modal.open(
                    <GamePlaysInfo
                      gameName={game.name}
                      playthroughs={gamePlaythroughs}
                    />
                  )
                }
              >
                Playthroughs
              </Button>
            </Box>
          );
        }}
      />
      <Pagination
        take={takeGames}
        total={total}
        isFixed
        isDisabled={isLoading}
        callback={(page) => {
          setIsLoading(true);
          debouncedGetGames(page);
        }}
      />
    </>
  );
};
