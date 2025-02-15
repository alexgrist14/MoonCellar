import { FC } from "react";
import styles from "./GamesList.module.scss";
import { Button } from "@/src/lib/shared/ui/Button";
import { IGDBGameMinimal } from "../../types/igdb";
import { ButtonGroup } from "../Button/ButtonGroup";

interface IGamesListProps {
  games: IGDBGameMinimal[];
  getGames?: (games: IGDBGameMinimal[]) => void;
  removeGame?: (game: IGDBGameMinimal) => void;
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
      <div className={styles.consoles__title}>
        {!!games?.length && <h3>Games:</h3>}
        {!games?.length && (
          <h3 style={{ width: "100%", textAlign: "center" }}>List is empty</h3>
        )}
        {!!games?.length && !!saveCallback && (
          <Button color="accent" onClick={() => saveCallback()}>
            Save
          </Button>
        )}
        {!!games?.length && !!getGames && (
          <Button color="red" onClick={() => getGames([])}>
            Remove all
          </Button>
        )}
      </div>
      <div className={styles.consoles__games}>
        {!!games?.length
          ? games.map((game, i) => (
              <ButtonGroup
                key={`${game._id}_${i}`}
                wrapperStyle={{
                  gridTemplateColumns: !!removeGame ? "1fr 20%" : "1fr",
                }}
                isCompact
                wrapperClassName={styles.consoles__game}
                buttons={[
                  {
                    title: game.name,
                    link: `/games/${game.slug}`,
                    target: "_blank",
                    color: "fancy",
                    style: { textAlign: "start" },
                  },
                  {
                    title: "Remove",
                    color: "red",
                    isHidden: !removeGame,
                    callback: () => !!removeGame && removeGame(game),
                  },
                ]}
              />
            ))
          : null}
      </div>
    </div>
  );
};
