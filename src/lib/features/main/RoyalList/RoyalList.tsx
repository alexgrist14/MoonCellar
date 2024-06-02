import { FC } from "react";
import styles from "./RoyalList.module.scss";
import { useAppDispatch, useAppSelector } from "@/src/lib/app/store";
import {setRoyalGamesIGDB, setRoyalGamesRA} from "@/src/lib/app/store/slices/selectedSlice";

export const RoyalList: FC = () => {
  const dispatch = useAppDispatch();

  const { royalGamesRA, royalGamesIGDB, apiType } = useAppSelector(
    (state) => state.selected
  );

  const royalGames = apiType === "RA" ? royalGamesRA : royalGamesIGDB;
  const setRoyalGames = apiType === "RA" ? setRoyalGamesRA : setRoyalGamesIGDB;

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
                <button
                  onClick={() =>
                    dispatch(
                      setRoyalGames(
                        royalGames.filter((_game) => game.id !== _game.id)
                      )
                    )
                  }
                >
                  Remove
                </button>
              </div>
            ))
          : null}
      </div>
    </div>
  );
};
