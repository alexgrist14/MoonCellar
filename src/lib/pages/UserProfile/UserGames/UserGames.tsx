import { FC, useEffect, useState } from "react";
import styles from "./UserGames.module.scss";
import {
  categoriesType,
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

interface UserGamesProps {
  userId: string;
  gamesCategory: categoriesType;
  gamesRating: IGamesRating[];
}

export const UserGames: FC<UserGamesProps> = ({
  userId,
  gamesRating,
  gamesCategory,
}) => {
  const { query } = useRouter();

  const page = Number(query.page);

  const [games, setGames] = useState<IGDBGameMinimal[]>([]);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(30);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [sortedGames, setSortedGames] = useState(games);

  const [currentGames, setCurrentGames] = useState<IGDBGameMinimal[]>(sortedGames.slice((page - 1) * take, page * take));

  // const sortedGames = [...games[gamesCategory]].sort((a, b) => {
  //   const ratingA =
  //     gamesRating.find((rating) => rating.game === a._id)?.rating || 0;
  //   const ratingB =
  //     gamesRating.find((rating) => rating.game === b._id)?.rating || 0;
  //   return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
  // });


  useEffect(()=>{
    userAPI.getUserGames(userId,gamesCategory).then((res)=>{
      setSortedGames(res.data.games[`${gamesCategory}`]);
    })
  },[gamesCategory, userId])

  useEffect(() => {
    setCurrentGames(sortedGames.slice((page - 1) * take, page * take));
    console.log('action');
  }, [gamesCategory, page, sortedGames, take]);

  useEffect(() => {
    if(sortedGames)
    setTotal(sortedGames.length);
  }, [sortedGames]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    setSortedGames((prev) => prev.reverse());
  };

  return (
    <div>
      <div className={styles.sort} onClick={toggleSortOrder}>
        <Icon
          className={classNames(styles.sort__icon, {
            [styles.sort__icon_active]: sortOrder === "asc",
          })}

          icon="iconamoon:sorting-left"
        />
        <p>Date</p>
      </div>

      <div className={styles.games}>
        {currentGames.map((game, i) => (
          <div key={gamesCategory + i} className={styles.games__game}>
            <GameCard game={game} />
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
          </div>
        ))}
        <Pagination take={take} total={total} isFixed />
        {!sortedGames.length && <p>There is no games</p>}
      </div>
    </div>
  );
};
