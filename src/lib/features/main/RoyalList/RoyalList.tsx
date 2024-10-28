import { FC } from "react";
import styles from "./RoyalList.module.scss";
import { Button } from "@/src/lib/shared/ui/Button";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";
import Link from "next/link";

export const RoyalList: FC = () => {
  const { royalGames, setRoyalGames } = useSelectedStore();

  return (
    <div className={styles.consoles__royal}>
      <div className={styles.consoles__title}>
        <h3>{!!royalGames?.length ? "Games:" : "List is empty"}</h3>
        {!!royalGames?.length && (
          <Button onClick={() => setRoyalGames([])}>Remove all</Button>
        )}
      </div>
      <div className={styles.consoles__games}>
        {!!royalGames?.length
          ? royalGames.map((game) => (
              <div key={game.id} className={styles.consoles__game}>
                <Link href={`/games/${game.slug}`} target="_blank">
                  {game.name}
                </Link>
                <Button
                  onClick={() =>
                    setRoyalGames(
                      royalGames.filter((_game) => game._id !== _game._id)
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
