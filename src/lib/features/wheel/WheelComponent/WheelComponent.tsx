import { FC, useEffect, useRef, useState } from "react";
import styles from "./WheelComponent.module.scss";
import classNames from "classnames";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";

interface WheelComponentProps {
  segColors: string[];
  primaryColor: string;
  contrastColor: string;
  buttonText: string;
  size?: number;
  fontFamily?: string;
  time?: number;
}

const max = 16;

export const WheelComponent: FC<WheelComponentProps> = ({
  buttonText = "Spin",
  contrastColor = "white",
  fontFamily = "Roboto",
  primaryColor = "black",
  segColors,
  size = 290,
  time = 5,
}) => {
  const { setWinner } = useCommonStore();
  const { games, isRoyal, royalGames } = useSelectedStore();

  const {
    isFinished,
    isLoading,
    isStarted,
    segments,
    setSegments,
    setFinished,
    setStarted,
    setLoading,
  } = useStatesStore();

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const angle = useRef(0);

  const [winnerAngle, setWinnerAngle] = useState(0);
  const [currentSegment, setCurrentSegment] = useState("");

  useEffect(() => {
    if (!segments?.length) {
      setSegments(Array(max).fill(""));
    }
  }, [segments, setSegments, isRoyal, royalGames]);

  useEffect(() => {
    if (!!currentSegment && isFinished) {
      if (!isRoyal) {
        !!games && setWinner(games[+currentSegment.split("_")[1]]);
      } else {
        !!royalGames && setWinner(royalGames[+currentSegment.split("_")[1]]);

        const filtered = segments?.filter(
          (segment) => segment !== currentSegment
        );
        !filtered?.length && setCurrentSegment("");

        !!royalGames &&
          setSegments(
            filtered?.length
              ? filtered
              : royalGames.map((game, i) => game.id + "_" + i)
          );
      }
    }
  }, [currentSegment, isFinished, games, isRoyal, royalGames]);

  useEffect(() => {
    const centerX = 300;
    const centerY = 300;
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    const drawSegment = (key: number, lastAngle: number, angle: number) => {
      let value = "";

      if (!segments) return;

      if (!isRoyal) {
        !!games?.length && (value = games[+segments[key].split("_")[1]]?.name);
      } else {
        !!royalGames?.length &&
          (value = royalGames[+segments[key].split("_")[1]]?.name);
      }

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
      if (!segments) return;

      const len = segments.length;
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
  }, [
    contrastColor,
    fontFamily,
    primaryColor,
    segColors,
    size,
    segments,
    games,
    royalGames,
    isRoyal,
  ]);

  useEffect(() => {
    if (isStarted && !!segments) {
      const winner = Math.ceil(Math.random() * (segments.length - 1));

      angle.current += 360 * Math.ceil(time);

      setWinnerAngle(
        angle.current +
          (360 - (360 / segments.length) * winner) -
          Math.floor(Math.random() * (360 / segments.length))
      );
      setStarted(false);

      setTimeout(() => {
        setFinished(true);
        !!segments && setCurrentSegment(segments[winner]);
      }, 5000);
    } else {
      setCurrentSegment("");
    }
  }, [isStarted, segments, time, setFinished, setStarted]);

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
