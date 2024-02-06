import { FC, ReactNode, useState } from "react";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";
import { useAppDispatch, useAppSelector } from "../../store";
import { setRoyalGames } from "../../store/commonSlice";

const WheelContainer: FC = () => {
  const dispatch = useAppDispatch();
  const { royalGames, winner, isRoyal } = useAppSelector(
    (state) => state.common
  );
  const { isStarted, isFinished } = useAppSelector((state) => state.states);

  const [currentWinner, setCurrentWinner] = useState<string | ReactNode>();

  function generateRandomColors(): string[] {
    const colors: string[] = [];

    const hueValues = ['30', '200', '220', '240', '270']; // Исключаем желтый, оранжевый и желто-оранжевый
    const lightnessValues = ['30%', '40%', '50%', '60%', '70%'];

    for (let i = 0; i < 16; i++) {
        const hue = hueValues[Math.floor(Math.random() * hueValues.length)];
        const lightness = lightnessValues[Math.floor(Math.random() * lightnessValues.length)];
        const saturation = '70%';

        const color = `hsl(${hue}, ${saturation}, ${lightness})`;

        colors.push(color);
    }

    return colors;
}
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
        setCurrentWinner={setCurrentWinner}
      />
      {(!!isStarted || !!isFinished) && (
        <div className={styles.winner}>
          <div className={styles.winner__container}>{currentWinner}</div>
        </div>
      )}
      <div className={styles.container__buttons}>
        {!!winner && !isRoyal && isFinished && (
          <button
            onClick={() =>
              dispatch(
                setRoyalGames(
                  !!royalGames?.length
                    ? royalGames.some((game) => game.id === winner.id)
                      ? royalGames.filter((game) => game.id !== winner.id)
                      : [...royalGames, winner]
                    : [winner]
                )
              )
            }
          >
            {royalGames?.some((game) => game.id === winner.id)
              ? "Remove from "
              : "Add to "}
            Battle Royal
          </button>
        )}
      </div>
    </div>
  );
};

export default WheelContainer;
