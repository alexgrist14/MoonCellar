import { FC, useEffect, useState } from "react";
import styles from "./UserGames.module.scss";
import {
  CategoriesType,
  IGamesRating,
  UserGamesType,
} from "@/src/lib/shared/types/user.type";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { Icon } from "@iconify/react";
import { useRouter } from "next/router";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import classNames from "classnames";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import { userAPI } from "@/src/lib/shared/api";
import { Loader } from "@/src/lib/shared/ui/Loader";

interface UserGamesProps {
  userId: string;
  gamesCategory: CategoriesType;
  gamesRating: IGamesRating[];
}

export const UserGames: FC<UserGamesProps> = ({
  userId,
  gamesRating,
  gamesCategory,
}) => {
  const { query } = useRouter();

  const page = Number(query.page);

  //const [games, setGames] = useState<IGDBGameMinimal[] | undefined>(undefined);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(30);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortedGames, setSortedGames] = useState<
    IGDBGameMinimal[] | undefined
  >();

  const [currentGames, setCurrentGames] = useState<IGDBGameMinimal[]>();

  // const sortedGames = [...games[gamesCategory]].sort((a, b) => {
  //   const ratingA =
  //     gamesRating.find((rating) => rating.game === a._id)?.rating || 0;
  //   const ratingB =
  //     gamesRating.find((rating) => rating.game === b._id)?.rating || 0;
  //   return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
  // });

  useEffect(() => {
    console.log("1");
    setSortedGames(undefined);
    setCurrentGames(undefined);
    userAPI.getUserGames(userId, gamesCategory).then((res) => {
      setTimeout(() => {
        setSortedGames(res.data.games[`${gamesCategory}`]);
      }, 200);
    });
  }, [gamesCategory, userId]);

  // useEffect(()=>{
  //   return(()=>{
  //     setSortedGames(undefined);
  //     setCurrentGames(undefined);
  //   })
  // },[])

  // useEffect(() => {

  //   if (sortedGames){
  //     setCurrentGames(sortedGames.slice((page - 1) * take, page * take));
  //   }

  // }, [gamesCategory, page, sortedGames, take]);

  useEffect(() => {
    if (sortedGames) setTotal(sortedGames.length);
  }, [sortedGames]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    //setSortedGames((prev) => prev.reverse());
  };

  return (
    <div className={styles.container}>
      <div className={styles.sort} onClick={toggleSortOrder}>
        <Icon
          className={classNames(styles.sort__icon, {
            [styles.sort__icon_active]: sortOrder === "asc",
          })}
          icon="iconamoon:sorting-left"
        />
        <p>Date</p>
      </div>

      <div className={classNames(styles.games)}>
        {!!sortedGames ? (
          sortedGames.slice((page - 1) * take, page * take).map((game) => (
            <GameCard key={game._id} game={game}>
              <div className={styles.games__info}>
                <p className={styles.games__title}>{game.name}</p>
                {gamesRating &&
                  gamesRating.find((rating) => rating.game === game._id)
                    ?.rating && (
                    <span className={styles.games__rating}>
                      {
                        gamesRating.find((rating) => rating.game === game._id)
                          ?.rating
                      }
                    </span>
                  )}
              </div>
            </GameCard>
          ))
        ) : (
          <Loader type="moon" />
        )}

        <Pagination take={take} total={total} isFixed />
        {sortedGames && !sortedGames.length && <p>There is no games</p>}
      </div>
    </div>
  );
};
