import { FC } from "react";
import styles from "./RoyalList.module.scss";
import { useAppDispatch, useAppSelector } from "../../../store";
import { setRoyalGames } from "../../../store/commonSlice";

const RoyalList: FC = () => {
  const dispatch = useAppDispatch();

  const { royalGames } = useAppSelector((state) => state.common);

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

export default RoyalList;
