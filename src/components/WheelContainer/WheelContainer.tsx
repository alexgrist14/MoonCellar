import { FC, ReactNode, useState } from "react";
import { IGame } from "../../interfaces/responses";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";
import { IIGDBGame } from "../../interfaces";
import { useAppDispatch, useAppSelector } from "../../store";
import { setRoyalGames } from "../../store/commonSlice";

interface WheelContainerProps {
  games: IGame[];
  gamesIGDB: IIGDBGame[];
  callback: () => void;
}

const WheelContainer: FC<WheelContainerProps> = ({
  games,
  gamesIGDB,
  callback,
}) => {
  const dispatch = useAppDispatch();
  const { royalGames, winner, isFinished, isStarted, apiType } = useAppSelector(
    (state) => state.common
  );

  const [currentWinner, setCurrentWinner] = useState<string | ReactNode>();

  const segColors = ["#815CD1", "#3DA5E0"];

  return (
    <div className={styles.container}>
      <WheelComponent
        segColors={segColors}
        primaryColor="black"
        contrastColor="white"
        buttonText="Spin"
        size={295}
        upDuration={100}
        downDuration={300}
        games={games}
        gamesIGDB={gamesIGDB}
        setCurrentWinner={setCurrentWinner}
        callback={callback}
      />
      {(!!isStarted || !!isFinished) && (
        <div className={styles.winner}>
          <div className={styles.winner__container}>
            <div>{currentWinner}</div>
          </div>
        </div>
      )}
      <div className={styles.container__buttons}>
        {!!winner && isFinished && apiType === "IGDB" && (
          <button
            onClick={() =>
              dispatch(
                setRoyalGames(
                  royalGames.some((game) => game.id === winner.id)
                    ? royalGames.filter((game) => game.id !== winner.id)
                    : [...royalGames, winner]
                )
              )
            }
          >
            {royalGames.some((game) => game.id === winner.id)
              ? "Remove from"
              : "Add to"}{" "}
            Battle Royal
          </button>
        )}
      </div>
    </div>
  );
};

export default WheelContainer;
