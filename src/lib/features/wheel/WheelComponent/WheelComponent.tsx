import { FC, useEffect, useRef, useState } from "react";
import styles from "./WheelComponent.module.scss";
import classNames from "classnames";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { IGDBGameMinimal } from "@/src/lib/shared/types/igdb";
import { shuffle } from "@/src/lib/shared/utils/common";

interface WheelComponentProps {
  segColors: string[];
  primaryColor: string;
  contrastColor: string;
  buttonText: string;
  size?: number;
  fontFamily?: string;
  time?: number;
}

const emptyGames: IGDBGameMinimal[] = Array(16)
  .fill("")
  .map(() => ({
    name: "",
    _id: -1,
    aggregated_rating: 0,
    artworks: [],
    category: 0,
    cover: { _id: -1, height: 0, url: "", width: 0 },
    first_release_date: 0,
    game_modes: [],
    genres: [],
    involved_companies: [],
    keywords: [],
    platforms: [],
    release_dates: [],
    screenshots: [],
    slug: "",
    storyline: "",
    summary: "",
    themes: [],
    total_rating: 0,
    url: "",
    websites: [],
  }));

export const WheelComponent: FC<WheelComponentProps> = ({
  buttonText = "Spin",
  contrastColor = "white",
  fontFamily = "Roboto",
  primaryColor = "black",
  segColors,
  size = 290,
  time = 5,
}) => {
  const { games, royalGames, addHistoryGame, setWinner } = useGamesStore();

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
  const [wheelGames, setWheelGames] = useState<IGDBGameMinimal[]>();

  useEffect(() => {
    if (isRoyal) {
      setWheelGames(!!royalGames?.length ? shuffle(royalGames) : emptyGames);
    } else {
      setWheelGames(!!games?.length ? shuffle(games) : emptyGames);
    }

    setWinner(undefined);
  }, [royalGames, games, isRoyal, setWinner]);

  useEffect(() => {
    const centerX = 300;
    const centerY = 300;
    const ctx = canvasRef.current?.getContext("2d");

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
      console.log('wheel');
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

    ctx.clearRect(0, 0, 600, 600);

    drawWheel();
  }, [contrastColor, fontFamily, primaryColor, segColors, size, wheelGames]);

  useEffect(() => {
    if (isStarted && !!wheelGames?.length && wheelGames[0]._id !== -1) {
      console.log('here');
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
        setWinner(wheelGames[winner]);

        if (isRoyal) {
          const filtered =
            wheelGames?.filter((game) => game._id !== wheelGames[winner]._id) ||
            [];

          setWheelGames(filtered.length > 1 ? filtered : []);
        } else {
          addHistoryGame(wheelGames[winner]);
        }
      }, 5000);
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
  ]);

  return (
    <div
      id="wheel"
      className={classNames(styles.wheel, {
        [styles.wheel_active]: !isFinished || (isRoyal && !royalGames?.length),
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
