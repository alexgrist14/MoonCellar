import { FC, ReactNode, useEffect, useState } from "react";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";
import { useAppDispatch, useAppSelector } from "../../store";
import { setRoyalGamesIGDB, setRoyalGamesRA } from "../../store/selectedSlice";

const WheelContainer: FC = () => {
  const dispatch = useAppDispatch();

  const { winner } = useAppSelector((state) => state.common);

  const { royalGamesRA, royalGamesIGDB, apiType } = useAppSelector(
    (state) => state.selected
  );

  const { isStarted, isFinished, segments } = useAppSelector(
    (state) => state.states
  );

  const [currentWinner, setCurrentWinner] = useState<string | ReactNode>();
  const [colors, setColors] = useState<string[]>([]);

  const royalGames = apiType === "RA" ? royalGamesRA : royalGamesIGDB;
  const setRoyalGames = apiType === "RA" ? setRoyalGamesRA : setRoyalGamesIGDB;

  useEffect(() => {
    const generateRandomColors = (hue: number): string[] => {
      return segments.map((_, i) => {
        const percent = 70 / segments.length;
        const lightness =
          (i < segments.length / 2
            ? percent * i
            : percent * (segments.length - i + 1)) + "%";
        const saturation = "60%";

        return `hsl(${hue}, ${saturation}, ${lightness})`;
      });
    };

    const hues = [220, 260, 180];

    !!segments?.length &&
      setColors(generateRandomColors(hues[(Math.random() * hues.length) ^ 0]));
  }, [segments]);

  return (
    <div className={styles.container}>
      <WheelComponent
        segColors={colors}
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
        {!!winner && isFinished && (
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
