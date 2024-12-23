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

interface UserGamesProps {
  userGames: UserGamesType;
  gamesCategory: categoriesType;
  gamesRating: IGamesRating[];
}

export const UserGames: FC<UserGamesProps> = ({
  userGames,
  gamesRating,
  gamesCategory,
}) => {
  const { query } = useRouter();

  const page = Number(query.page);

  const [games, setGames] = useState(userGames);
  const [total, setTotal] = useState(0);
  const [take, setTake] = useState(30);
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const sortedGames = [...games[gamesCategory]].sort((a, b) => {
    const ratingA =
      gamesRating.find((rating) => rating.game === a._id)?.rating || 0;
    const ratingB =
      gamesRating.find((rating) => rating.game === b._id)?.rating || 0;
    return sortOrder === "asc" ? ratingA - ratingB : ratingB - ratingA;
  });

  const currentGames = sortedGames.slice((page - 1) * take, page * take);

  useEffect(() => {
    setTotal(games[gamesCategory].length);
  }, [games, gamesCategory]);

  const toggleSortOrder = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  return (
    <>
      <Icon
        className={styles.sort__icon}
        onClick={toggleSortOrder}
        icon="iconamoon:sorting-left"
      />
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
        {!games[gamesCategory].length && <p>There is no games</p>}
      </div>
    </>
  );
};
