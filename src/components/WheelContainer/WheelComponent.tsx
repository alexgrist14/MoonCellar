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
import { getSegments } from "../../utils/getSegments";

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
  setCurrentWinner: Dispatch<SetStateAction<ReactNode | string>>;
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
  setCurrentWinner,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [isFinished, setIsFinished] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
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

  const onTimerTick = useCallback(
    (maxSpeed: number, spinStartDate: number, initialAngle: number) => {
      let angleDelta = initialAngle;

      const duration = new Date().getTime() - spinStartDate;

      let progress = 0;
      let finished = false;

      if (duration < upTime) {
        progress = duration / upTime;
        angleDelta = maxSpeed * Math.sin((progress * Math.PI) / 2);
      } else {
        progress = duration / downTime;
        angleDelta =
          maxSpeed * Math.sin((progress * Math.PI) / 2 + Math.PI / 2);
        if (progress >= 1) finished = true;
      }

      if (finished) {
        setIsStarted(false);
        setIsFinished(true);
        clearInterval(timer.current);
      } else {
        setAngleCurrent((angleCurrent) => angleCurrent + angleDelta);
      }
    },
    [downTime, upTime]
  );

  const spin = useCallback(() => {
    console.log("spin");
    timer.current = setInterval(
      () => onTimerTick(Math.PI / segmentsLength, spinStartDate.current, 0),
      10
    );
  }, [onTimerTick]);

  useEffect(() => {
    setSegments(getSegments(games, segmentsLength));
  }, [games]);

  useEffect(() => {
    angleCurrent >= Math.PI * 2 && setAngleCurrent(angleCurrent - Math.PI * 2);
  }, [angleCurrent]);

  useEffect(() => {
    const findGameIdByTitle = (
      title: string
    ): { id: number; image: string } | undefined => {
      const foundGame = games.find((game) => game.title === title);
      return foundGame
        ? { id: foundGame.id, image: foundGame.imageIcon }
        : undefined;
    };

    setCurrentWinner(
      isFinished ? (
        <div className={styles.winner__content}>
          <img
            className={styles.img}
            src={`https://retroachievements.org${
              findGameIdByTitle(currentSegment)?.image
            }`}
            alt="game"
          />
          <a
            className={styles.link}
            href={`https://retroachievements.org/game/${
              findGameIdByTitle(currentSegment)?.id
            }`}
            target="_blank"
            rel="noreferrer"
          >
            {currentSegment}
          </a>
        </div>
      ) : (
        currentSegment
      )
    );
  }, [currentSegment, isFinished, setCurrentWinner, games]);

  useEffect(() => {
    if (!segments || !segments.length || isFinished) return;
    console.log(segments);

    const centerX = 300;
    const centerY = 300;
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    const drawSegment = (key: any, lastAngle: any, angle: any) => {
      const value = segments[key];

      ctx.save();
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, size, lastAngle, angle, false);
      ctx.lineTo(centerX, centerY);
      ctx.closePath();
      ctx.fillStyle = segColors[key];
      ctx.fill();
      ctx.stroke();
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((lastAngle + angle) / 2);
      ctx.fillStyle = contrastColor;
      ctx.font = "bold 1em " + fontFamily;
      ctx.fillText(value.slice(0, 21), size / 2 + 20, 0);
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

      if (i < 0) {
        i = i + segments.length;
      } else {
        setCurrentSegment(segments[i]);
      }

      console.log(segments[i]);
    };

    console.log("draw");

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
  ]);

  return (
    <div id="wheel" className={styles.wheel}>
      <canvas
        ref={canvasRef}
        id="canvas"
        className={styles.canvas}
        width="600"
        height="600"
        onClick={() => {
          if (isStarted) return;

          setIsStarted(true);
          setIsFinished(false);
          setSegments(getSegments(games, segmentsLength));
          spinStartDate.current = new Date().getTime();

          spin();
        }}
      />
    </div>
  );
};
export default WheelComponent;
