import {
  Dispatch,
  FC,
  ReactNode,
  SetStateAction,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./WheelContainer.module.scss";
import { IGame } from "../../interfaces/responses";
import { IIGDBGame } from "../../interfaces";
import { useAppDispatch, useAppSelector } from "../../store";
import { setLoading } from "../../store/commonSlice";
import classNames from "classnames";

interface WheelComponentProps {
  segColors: string[];
  primaryColor: string;
  contrastColor: string;
  buttonText: string;
  size?: number;
  upDuration: number;
  downDuration: number;
  fontFamily?: string;
  games: IGame[];
  gamesIGDB: IIGDBGame[];
  setCurrentWinner: Dispatch<SetStateAction<ReactNode | string>>;
  callback: () => void;
}

const segmentsLength = 15;

const WheelComponent: FC<WheelComponentProps> = ({
  segColors,
  primaryColor = "black",
  contrastColor = "white",
  buttonText = "Spin",
  size = 290,
  upDuration,
  downDuration,
  fontFamily = "Roboto",
  games,
  gamesIGDB,
  setCurrentWinner,
  callback,
}) => {
  const dispatch = useAppDispatch();

  const { isLoading, apiType } = useAppSelector((state) => state.common);

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFinished, setIsFinished] = useState(false);
  const [currentSegment, setCurrentSegment] = useState("");
  const [angleCurrent, setAngleCurrent] = useState(0);
  const [segments, setSegments] = useState<string[]>();

  const timer = useRef<NodeJS.Timer>();
  const spinStartDate = useRef(0);

  const upTime = segmentsLength * upDuration;
  const downTime = segmentsLength * downDuration;

  const clear = useCallback(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");

    ctx && ctx.clearRect(0, 0, 1000, 800);
  }, []);

  const onTimerTick = useCallback(() => {
    let angleDelta = 0;
    const maxSpeed = Math.PI / segmentsLength;

    const duration = new Date().getTime() - spinStartDate.current;

    let progress = 0;
    let finished = false;

    if (duration < upTime) {
      !isLoading && (progress = duration / upTime);
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2);
    } else {
      !isLoading && (progress = duration / downTime);
      angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
      if (progress >= 1) finished = true;
    }

    if (finished) {
      setIsFinished(true);
      clearInterval(timer.current);
    } else {
      setAngleCurrent((angleCurrent) => angleCurrent + angleDelta);
    }
  }, [downTime, upTime, isLoading]);

  const spin = useCallback(() => {
    spinStartDate.current = new Date().getTime();

    timer.current = setInterval(() => onTimerTick(), 10);
  }, [onTimerTick]);

  useEffect(() => {
    setSegments(
      (apiType === "RA" ? games : gamesIGDB).map((game, i) => game.id + "_" + i)
    );
  }, [games, gamesIGDB, apiType]);

  useEffect(() => {
    angleCurrent >= Math.PI * 2 && setAngleCurrent(angleCurrent - Math.PI * 2);
  }, [angleCurrent]);

  useEffect(() => {
    !!currentSegment &&
      setCurrentWinner(
        isFinished ? (
          <div className={styles.winner__content}>
            <a
              className={styles.link}
              href={
                apiType === "RA"
                  ? `https://retroachievements.org/game/${
                      games[+currentSegment.split("_")[1]]?.id
                    }`
                  : gamesIGDB[+currentSegment.split("_")[1]]?.url || ""
              }
              target="_blank"
              rel="noreferrer"
            >
              {apiType === "RA"
                ? games[+currentSegment.split("_")[1]]?.title || ""
                : gamesIGDB[+currentSegment.split("_")[1]]?.name || ""}
            </a>
          </div>
        ) : apiType === "RA" ? (
          games[+currentSegment.split("_")[1]]?.title || ""
        ) : (
          gamesIGDB[+currentSegment.split("_")[1]]?.name || ""
        )
      );
  }, [currentSegment, isFinished, setCurrentWinner, games, gamesIGDB, apiType]);

  useEffect(() => {
    if (!segments || !segments.length || isFinished) return;

    const centerX = 300;
    const centerY = 300;
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    const drawSegment = (key: any, lastAngle: any, angle: any) => {
      const value = apiType === "RA" ? games[key]?.title : gamesIGDB[key]?.name;

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, size, lastAngle, angle, false);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fillStyle = segColors[key % 2 ? 0 : 1];
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((lastAngle + angle) / 2);
      ctx.fillStyle = contrastColor;
      ctx.font = "bold 1em " + fontFamily;
      ctx.fillText(value?.slice(0, 21) || "", size / 2 + 20, 0);
      ctx.restore();
    };

    const drawWheel = () => {
      const len = segments.length;
      const PI2 = Math.PI * 2;

      let lastAngle = angleCurrent;

      ctx.lineWidth = 1;
      ctx.strokeStyle = "primaryColor";
      ctx.textBaseline = "middle";
      ctx.textAlign = "center";
      ctx.font = "1em " + fontFamily;
      for (let i = 1; i <= len; i++) {
        const angle = PI2 * (i / len) + angleCurrent;
        drawSegment(i - 1, lastAngle, angle);
        lastAngle = angle;
      }

      // Draw a center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 50, 0, PI2, false);
      ctx.closePath();
      ctx.fillStyle = primaryColor;
      ctx.lineWidth = 10;
      ctx.strokeStyle = contrastColor;
      ctx.fill();
      ctx.font = "bold 1em " + fontFamily;
      ctx.fillStyle = contrastColor;
      ctx.textAlign = "center";
      ctx.fillText(buttonText, centerX, centerY + 3);
      ctx.stroke();

      // Draw outer circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, size, 0, PI2, false);
      ctx.closePath();

      ctx.lineWidth = 10;
      ctx.strokeStyle = primaryColor;
      ctx.stroke();
    };

    const drawNeedle = () => {
      ctx.lineWidth = 1;
      ctx.strokeStyle = contrastColor;
      ctx.fillStyle = contrastColor;
      ctx.beginPath();
      ctx.moveTo(centerX + 20, centerY - 50);
      ctx.lineTo(centerX - 20, centerY - 50);
      ctx.lineTo(centerX, centerY - 70);
      ctx.closePath();
      ctx.fill();

      const change = angleCurrent + Math.PI / 2;

      let i =
        segments.length -
        Math.floor((change / (Math.PI * 2)) * segments.length) -
        1;

      i < 0 && (i = i + segments.length);

      setCurrentSegment(segments[i]);
    };

    clear();
    drawWheel();
    drawNeedle();
  }, [
    isFinished,
    buttonText,
    clear,
    contrastColor,
    fontFamily,
    primaryColor,
    segColors,
    size,
    angleCurrent,
    segments,
    games,
    gamesIGDB,
  ]);

  return (
    <div
      id="wheel"
      className={classNames(styles.wheel, {
        [styles.wheel_disabled]: isLoading,
      })}
    >
      <canvas
        ref={canvasRef}
        id="canvas"
        className={styles.canvas}
        width="600"
        height="600"
        onClick={() => {
          if (isLoading) return;

          setIsFinished(false);
          dispatch(setLoading(true));

          callback();

          spin();
        }}
      />
    </div>
  );
};

export default WheelComponent;
