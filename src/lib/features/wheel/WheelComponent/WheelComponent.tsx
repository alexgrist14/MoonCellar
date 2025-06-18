import { FC, useEffect, useRef, useState } from "react";
import styles from "./WheelComponent.module.scss";
import classNames from "classnames";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { emptyGames } from "@/src/lib/shared/constants/games.const";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useWheel } from "@/src/lib/shared/hooks/useWheel";
import { shuffle } from "@/src/lib/shared/utils/common";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";

interface WheelComponentProps {
  primaryColor?: string;
  contrastColor?: string;
  buttonText: string;
  size?: number;
  fontFamily?: string;
  time?: number;
}

export const WheelComponent: FC<WheelComponentProps> = ({
  buttonText = "Spin",
  contrastColor = "white",
  fontFamily = "pentagra",
  primaryColor = "black",
  size = 290,
  time = 5,
}) => {
  const { addHistoryGame, setWinner, games, setRoyalGames, royalGames } =
    useGamesStore();
  const {
    isFinished,
    isLoading,
    isStarted,
    setFinished,
    setStarted,
    setLoading,
    isRoyal,
  } = useStatesStore();

  const angle = useRef(0);
  const [winnerAngle, setWinnerAngle] = useState(0);
  const [wheelGames, setWheelGames] = useState<IGDBGameMinimal[]>([]);

  const { drawWheel, parseImages } = useWheel({
    contrastColor,
    fontFamily,
    primaryColor,
    size,
  });

  useEffect(() => {
    if (isStarted && !!wheelGames?.length) {
      const winner = Math.floor(Math.random() * wheelGames.length);

      angle.current += 360 * Math.ceil(time);

      setWinnerAngle(
        angle.current +
          (360 - (360 / wheelGames.length) * winner) -
          Math.floor(Math.random() * (360 / wheelGames.length))
      );

      setStarted(false);

      setTimeout(() => {
        setFinished(true);

        if (isRoyal) {
          !!wheelGames?.length &&
            setWheelGames(
              wheelGames?.filter((game) => game._id !== wheelGames[winner]._id)
            );
        } else {
          addHistoryGame(wheelGames[winner]);
        }

        setWinner(wheelGames[winner]);
      }, time * 1000);
    }
  }, [
    isRoyal,
    isStarted,
    time,
    setFinished,
    setStarted,
    setWinner,
    addHistoryGame,
    setRoyalGames,
    wheelGames,
  ]);

  useEffect(() => {
    !wheelGames.length &&
      setWheelGames(
        isRoyal
          ? !!royalGames?.length
            ? shuffle(royalGames)
            : []
          : games || []
      );
  }, [games, royalGames, isRoyal, wheelGames]);

  useEffect(() => {
    drawWheel([], emptyGames);
    setWheelGames([]);
  }, [drawWheel, isRoyal]);

  return (
    <div
      id="wheel"
      className={classNames(styles.wheel, {
        [styles.wheel_active]: !isFinished,
        [styles.wheel_disabled]: isLoading,
      })}
    >
      <div className={styles.wheel__center}>
        <button
          disabled={isRoyal && !games?.length}
          id="spin-button"
          onClick={() => {
            setFinished(false);
            setWinner(undefined);

            if (isRoyal) {
              !!wheelGames?.length &&
                parseImages(wheelGames).then((images) => {
                  drawWheel(images, wheelGames);
                  setStarted(true);
                });
            } else {
              setLoading(true);
            }
          }}
        >
          {buttonText}
        </button>
        {(isLoading || isStarted) && (
          <Loader type="moon" className={styles.wheel__loader} />
        )}
      </div>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polyline points="0,0 50,50 0,100" stroke="white" strokeWidth={4} />
      </svg>
      <canvas
        id="wheel-canvas"
        className={styles.canvas}
        width="600"
        height="600"
        style={{
          rotate: `${winnerAngle}deg`,
          transition: `${time}s`,
        }}
      />
    </div>
  );
};
