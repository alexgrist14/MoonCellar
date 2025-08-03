import { FC } from "react";
import styles from "./GamesList.module.scss";
import { Button } from "@/src/lib/shared/ui/Button";
import { ButtonGroup } from "../Button/ButtonGroup";
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
                  display: "grid",
                  width: "100%",
                  gridTemplateColumns: !!removeGame ? "1fr 20%" : "1fr",
                }}
                wrapperClassName={styles.consoles__game}
                buttons={[
                  {
                    title: game.name,
                    link: `/games/${game.slug}`,
                    target: "_blank",
                    color: "fancy",
                    compact: true,
                    style: { justifyContent: "flex-start", width: "100%" },
                  },
                  {
                    title: "Remove",
                    color: "red",
                    hidden: !removeGame,
                    compact: true,
                    onClick: () => !!removeGame && removeGame(game),
                  },
                ]}
              />
            ))
          : null}
      </div>
    </div>
  );
};
