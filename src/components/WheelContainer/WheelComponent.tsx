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
import {
  setRoyalGamesIGDB,
  setRoyalGamesRA,
  setWinner,
} from "../../store/commonSlice";
import classNames from "classnames";
import { getSegments } from "../../utils/getSegments";
import { setFinished, setStarted } from "../../store/statesSlice";

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

const segmentsLength = 16;

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

  const { royalGamesIGDB, royalGamesRA, isRoyal, apiType, winner } =
    useAppSelector((state) => state.common);
  const { isLoading, isFinished, isStarted } = useAppSelector(
    (state) => state.states
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [currentSegment, setCurrentSegment] = useState("");
  const [angleCurrent, setAngleCurrent] = useState(0);
  const [segments, setSegments] = useState<string[]>([]);

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
      dispatch(setFinished(true));

      clearInterval(timer.current);
    } else {
      setAngleCurrent((angleCurrent) => angleCurrent + angleDelta);
    }
  }, [downTime, upTime, isLoading, dispatch]);

  const spin = useCallback(() => {
    spinStartDate.current = new Date().getTime();

    timer.current = setInterval(() => onTimerTick(), 10);
  }, [onTimerTick]);

  useEffect(() => {
    dispatch(setWinner(undefined));
    dispatch(setFinished(false));
    dispatch(setStarted(false));
  }, [apiType, dispatch, isRoyal]);

  useEffect(() => {
    if (isRoyal) return;

    if (apiType === "RA" && !!games.length)
      return setSegments(getSegments(games, segmentsLength));

    if (apiType === "IGDB" && !!gamesIGDB.length)
      return setSegments(gamesIGDB.map((game, i) => game.id + "_" + i));
  }, [games, apiType, gamesIGDB, isRoyal]);

  useEffect(() => {
    if (isRoyal) {
      return setSegments(
        (apiType === "RA" ? royalGamesRA : royalGamesIGDB)?.length
          ? (apiType === "RA" ? royalGamesRA : royalGamesIGDB).map(
              (game, i) => game.id + "_" + i
            )
          : Array(16).fill("")
      );
    }
  }, [apiType, royalGamesRA, royalGamesIGDB, isRoyal, dispatch]);

  useEffect(() => {
    angleCurrent >= Math.PI * 2 && setAngleCurrent(angleCurrent - Math.PI * 2);
  }, [angleCurrent]);

  useEffect(() => {
    if (!!currentSegment) {
      if (isStarted && isFinished && apiType === "RA") {
        dispatch(setStarted(false));
        dispatch(setWinner(games[+currentSegment.split("_")[1]]));
      }

      if (isStarted && isFinished && apiType === "IGDB") {
        dispatch(setStarted(false));
        dispatch(setWinner(gamesIGDB[+currentSegment.split("_")[1]]));
      }

      if (isStarted && isFinished && isRoyal) {
        dispatch(setStarted(false));
        dispatch(
          setWinner(
            (apiType === "RA" ? royalGamesRA : royalGamesIGDB)[
              +currentSegment.split("_")[1]
            ]
          )
        );
        dispatch(
          apiType === "RA"
            ? setRoyalGamesRA(
                royalGamesRA.filter(
                  (game) => game.id !== +currentSegment.split("_")[0]
                )
              )
            : setRoyalGamesIGDB(
                royalGamesIGDB.filter(
                  (game) => game.id !== +currentSegment.split("_")[0]
                )
              )
        );
      }

      const getLink = () => {
        if (!isRoyal && apiType === "RA")
          return `https://retroachievements.org/game/${
            games[+currentSegment.split("_")[1]]?.id
          }`;
        if (!isRoyal && apiType === "IGDB")
          return gamesIGDB[+currentSegment.split("_")[1]]?.url || "";
        if (isRoyal)
          return (
            (apiType === "RA"
              ? "https://retroachievements.org/game/" + (winner as IGame)?.id
              : (winner as IIGDBGame)?.url) || ""
          );
      };

      const getTitle = () => {
        if (!isRoyal && apiType === "RA")
          return games[+currentSegment.split("_")[1]]?.title || "";
        if (!isRoyal && apiType === "IGDB")
          return gamesIGDB[+currentSegment.split("_")[1]]?.name || "";
        if (isRoyal)
          return (
            (apiType === "RA"
              ? (winner as IGame)?.title
              : (winner as IIGDBGame)?.name) ||
            (apiType === "RA"
              ? royalGamesRA[+currentSegment.split("_")[1]]?.title
              : royalGamesIGDB[+currentSegment.split("_")[1]]?.name) ||
            ""
          );
      };

      setCurrentWinner(
        isFinished ? (
          <div className={styles.winner__content}>
            <a
              className={styles.link}
              href={getLink()}
              target="_blank"
              rel="noreferrer"
            >
              {getTitle()}
            </a>
          </div>
        ) : (
          getTitle()
        )
      );
    }
  }, [
    currentSegment,
    isFinished,
    isStarted,
    winner,
    setCurrentWinner,
    games,
    gamesIGDB,
    isRoyal,
    royalGamesRA,
    royalGamesIGDB,
    apiType,
    dispatch,
  ]);

  useEffect(() => {
    const centerX = 300;
    const centerY = 300;
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    const drawSegment = (key: any, lastAngle: any, angle: any) => {
      let value = "";

      if (!isRoyal) {
        apiType === "RA" &&
          !!games.length &&
          (value = games[+segments[key].split("_")[1]]?.title);
        apiType === "IGDB" &&
          !!gamesIGDB.length &&
          (value = gamesIGDB[key]?.name);
      } else {
        ((apiType === "RA" && !!royalGamesRA?.length) ||
          (apiType === "IGDB" && !!royalGamesIGDB?.length)) &&
          (value =
            apiType === "RA"
              ? royalGamesRA[+segments[key].split("_")[1]]?.title
              : royalGamesIGDB[+segments[key].split("_")[1]]?.name);
      }

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
    royalGamesRA,
    royalGamesIGDB,
    isRoyal,
    apiType,
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
          if (isLoading || isStarted || !segments[0]) return;

          dispatch(setStarted(true));
          dispatch(setFinished(false));
          dispatch(setWinner(undefined));

          callback();

          spin();
        }}
      />
    </div>
  );
};

export default WheelComponent;
