import { FC } from "react";
import styles from "./GamesList.module.scss";
import { Button } from "@/src/lib/shared/ui/Button";
import Link from "next/link";
import { IGDBGameMinimal } from "../../types/igdb";

interface IGamesListProps {
  games: IGDBGameMinimal[];
  getGames: (games: IGDBGameMinimal[]) => void;
  removeGame: (game: IGDBGameMinimal) => void;
}

export const GamesList: FC<IGamesListProps> = ({
  games,
  getGames,
  removeGame,
}) => {
  return (
    <div className={styles.consoles__royal}>
      <div className={styles.consoles__title}>
        {!!games?.length && <h3>Games:</h3>}
        {!games?.length && (
          <h3 style={{ width: "100%", textAlign: "center" }}>List is empty</h3>
        )}
        {!!games?.length && (
          <Button onClick={() => getGames([])}>Remove all</Button>
        )}
      </div>
      <div className={styles.consoles__games}>
        {!!games?.length
          ? games.map((game) => (
              <div key={game._id} className={styles.consoles__game}>
                <Link href={`/games/${game.slug}`} target="_blank">
                  {game.name}
                </Link>
                <Button onClick={() => removeGame(game)}>Remove</Button>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};
