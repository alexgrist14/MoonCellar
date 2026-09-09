import { FC } from "react";
import styles from "./GamesList.module.scss";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { IGameResponse } from "../../lib/schemas/games.schema";

interface IGamesListProps {
  games: IGameResponse[];
  getGames?: (games: IGameResponse[]) => void;
  removeGame?: (game: IGameResponse) => void;
  saveCallback?: () => void;
}

export const GamesList: FC<IGamesListProps> = ({
  games,
  getGames,
  removeGame,
  saveCallback,
}) => {
  return (
    <div className={styles.consoles__royal}>
      {(!games?.length || !!saveCallback || !!getGames) && (
        <div className={styles.consoles__title}>
          {!games?.length && (
            <h3 style={{ width: "100%", textAlign: "center" }}>
              List is empty
            </h3>
          )}
          {!!games?.length && !!saveCallback && (
            <Button color={ButtonColor.ACCENT} onClick={() => saveCallback()}>
              Save
            </Button>
          )}
          {!!games?.length && !!getGames && (
            <Button color={ButtonColor.RED} onClick={() => getGames([])}>
              Remove all
            </Button>
          )}
        </div>
      )}
      <div className={styles.consoles__games}>
        {!!games?.length
          ? games.map((game, i) => (
              <div key={`${game._id}_${i}`} className={styles.consoles__game}>
                <GameCard game={game} />
                {!!removeGame && (
                  <Button
                    color={ButtonColor.RED}
                    compact
                    className={styles.consoles__remove}
                    onClick={() => removeGame(game)}
                  >
                    Remove
                  </Button>
                )}
              </div>
            ))
          : null}
      </div>
    </div>
  );
};
