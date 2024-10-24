import { FC } from "react";
import styles from "./RoyalList.module.scss";
import { Button } from "@/src/lib/shared/ui/Button";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";

export const RoyalList: FC = () => {
  const { royalGames, setRoyalGames } = useSelectedStore();

  return (
    <div className={styles.consoles__royal}>
      <h3>Games:</h3>
      <div className={styles.consoles__games}>
        {!!royalGames?.length
          ? royalGames.map((game) => (
              <div key={game.id} className={styles.consoles__game}>
                <a
                  href={`https://retroachievements.org/game/${game.id}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {game.name}
                </a>
                <Button
                  onClick={() =>
                    setRoyalGames(
                      royalGames.filter((_game) => game.id !== _game.id)
                    )
                  }
                >
                  Remove
                </Button>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};
