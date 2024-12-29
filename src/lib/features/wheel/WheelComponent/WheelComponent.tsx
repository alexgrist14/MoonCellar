import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./WheelComponent.module.scss";
import classNames from "classnames";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { emptyGames } from "@/src/lib/shared/constants/games.const";

interface WheelComponentProps {
  segColors: string[];
  primaryColor: string;
  contrastColor: string;
  buttonText: string;
  size?: number;
  fontFamily?: string;
  time?: number;
  wheelGames: IGDBGameMinimal[];
  setWheelGames: Dispatch<SetStateAction<IGDBGameMinimal[]>>;
}

export const WheelComponent: FC<WheelComponentProps> = ({
  buttonText = "Spin",
  contrastColor = "white",
  fontFamily = "Roboto",
  primaryColor = "black",
  segColors,
  size = 290,
  time = 5,
  wheelGames,
  setWheelGames,
}) => {
  const { addHistoryGame, setWinner } = useGamesStore();

  const {
    isFinished,
    isLoading,
    isStarted,
    setFinished,
    setStarted,
    setLoading,
    isRoyal,
  } = useStatesStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const angle = useRef(0);

  const [winnerAngle, setWinnerAngle] = useState(0);

  useEffect(() => {
    if (!canvasRef.current) return;

    const centerX = canvasRef.current.width / 2;
    const centerY = canvasRef.current.height / 2;
    const ctx = canvasRef.current.getContext("2d");

    if (!ctx) return;

    const drawSegment = (key: number, lastAngle: number, angle: number) => {
      if (!wheelGames?.length) return;

      const value = wheelGames[key].name;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, size, lastAngle, angle, false);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fillStyle = segColors[key];
      ctx.fill();
      ctx.stroke();
      ctx.lineWidth = 1;
      ctx.strokeStyle = "black";
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((lastAngle + angle) / 2);
      ctx.fillStyle = contrastColor;
      ctx.font = "bold 1em " + fontFamily;
      ctx.fillText(
        value?.length > 19 ? value.slice(0, 20) + "..." : value || "",
        size / 2 + 20,
        0
      );
      ctx.restore();
    };

    const drawWheel = () => {
      if (!wheelGames?.length) return;

      const len = wheelGames.length;
      const PI2 = Math.PI * 2;

      let lastAngle = 0;

      ctx.lineWidth = 1;
      ctx.strokeStyle = "primaryColor";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "1em " + fontFamily;

      for (let i = 1; i <= len; i++) {
        const angle = PI2 * (i / len);

        drawSegment(i - 1, lastAngle, angle);

        lastAngle = angle;
      }

      ctx.beginPath();
      ctx.arc(centerX, centerY, size, 0, PI2, false);
      ctx.closePath();

      ctx.lineWidth = 10;
      ctx.strokeStyle = primaryColor;
      ctx.stroke();
    };

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    drawWheel();
  }, [contrastColor, fontFamily, primaryColor, segColors, size, wheelGames]);

  useEffect(() => {
    if (isStarted && !!wheelGames?.length && wheelGames[0]._id !== -1) {
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
          setWheelGames((wheelGames) =>
            wheelGames.filter((game) => game._id !== wheelGames[winner]._id)
          );
        } else {
          addHistoryGame(wheelGames[winner]);
        }

        setWinner(wheelGames[winner]);
      }, time * 1000);
    }
  }, [
    isStarted,
    wheelGames,
    time,
    setFinished,
    setStarted,
    setWinner,
    isRoyal,
    addHistoryGame,
    setWheelGames,
  ]);

  return (
    <div
      id="wheel"
      className={classNames(styles.wheel, {
        [styles.wheel_active]: !isFinished,
        [styles.wheel_disabled]: isLoading,
      })}
    >
      <button
        onClick={() => {
          setFinished(false);
          setWinner(undefined);

          if (isRoyal) {
            return setStarted(true);
          } else {
            setWheelGames(emptyGames);
            setLoading(true);
          }
        }}
      >
        {buttonText}
      </button>
      <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
        <polyline points="0,0 50,50 0,100" stroke="white" strokeWidth={4} />
      </svg>
      <canvas
        ref={canvasRef}
        id="canvas"
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
