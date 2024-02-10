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
import { useAppDispatch, useAppSelector } from "../../store";
import { setWinner } from "../../store/commonSlice";
import classNames from "classnames";
import { getSegments } from "../../utils/getSegments";
import {
  setFinished,
  setLoading,
  setSegments,
  setStarted,
} from "../../store/statesSlice";
import { setRoyalGamesIGDB, setRoyalGamesRA } from "../../store/selectedSlice";

interface WheelComponentProps {
  segColors: string[];
  primaryColor: string;
  contrastColor: string;
  buttonText: string;
  size?: number;
  upDuration: number;
  downDuration: number;
  fontFamily?: string;
  setCurrentWinner: Dispatch<SetStateAction<ReactNode | string>>;
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
  setCurrentWinner,
}) => {
  const dispatch = useAppDispatch();

  const { games, winner } = useAppSelector((state) => state.common);

  const { isRoyal, royalGamesRA, royalGamesIGDB, apiType } = useAppSelector(
    (state) => state.selected
  );

  const { isLoading, isFinished, isStarted, segments } = useAppSelector(
    (state) => state.states
  );

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const isRemoved = useRef(false);

  const [currentSegment, setCurrentSegment] = useState("");
  const [angleCurrent, setAngleCurrent] = useState(0);

  const royalGames = apiType === "RA" ? royalGamesRA : royalGamesIGDB;

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
      dispatch(setFinished(true)); // ;
      dispatch(setStarted(false));
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
    !segments?.length && dispatch(setSegments(Array(segmentsLength).fill("")));
  }, [segments, dispatch]);

  useEffect(() => {
    angleCurrent >= Math.PI * 2 && setAngleCurrent(angleCurrent - Math.PI * 2);
  }, [angleCurrent]);

  useEffect(() => {
    if (!!currentSegment) {
      if (!isStarted && isFinished && !isRoyal) {
        dispatch(setWinner(games[+currentSegment.split("_")[1]]));
      }

      if (!isRemoved.current && !isStarted && isFinished && isRoyal) {
        console.log(isFinished);
        const setRoyalGames =
          apiType === "RA" ? setRoyalGamesRA : setRoyalGamesIGDB;

        isRemoved.current = true;
        dispatch(setWinner(royalGames[+currentSegment.split("_")[1]]));

        const excluded = royalGames.filter(
          (game) => game.id !== +currentSegment.split("_")[0]
        );

        dispatch(
          setSegments(
            !!excluded?.length
              ? excluded.map((game, i) => game.id + "_" + i)
              : Array(segmentsLength).fill("")
          )
        );

        dispatch(setRoyalGames(excluded));
      }

      const getLink = () => {
        return !isRoyal
          ? games[+currentSegment.split("_")[1]]?.url || ""
          : winner?.url || royalGames[+currentSegment.split("_")[1]]?.url || "";
      };

      const getImage = () => {
        return !isRoyal
          ? games[+currentSegment.split("_")[1]]?.image || ""
          : winner?.image ||
              royalGames[+currentSegment.split("_")[1]]?.image ||
              "";
      };

      const getTitle = () => {
        return !isRoyal
          ? games[+currentSegment.split("_")[1]]?.name || ""
          : winner?.name ||
              royalGames[+currentSegment.split("_")[1]]?.name ||
              "";
      };

      setCurrentWinner(
        <div className={styles.winner__content}>
          <div
            className={classNames(styles.winner__image, {
              [styles.winner__image_active]: isFinished && getImage(),
            })}
            style={{
              ...(isFinished && { backgroundImage: `url(${getImage()})` }),
            }}
          />
          <a
            className={styles.link}
            href={getLink()}
            target="_blank"
            rel="noreferrer"
          >
            {getTitle()}
          </a>
          <div></div>
        </div>
      );
    }
  }, [
    currentSegment,
    isFinished,
    isStarted,
    winner,
    setCurrentWinner,
    games,
    isRoyal,
    royalGames,
    apiType,
    dispatch,
    isRemoved,
  ]);

  useEffect(() => {
    const centerX = 300;
    const centerY = 300;
    const ctx = canvasRef.current?.getContext("2d");

    if (!ctx) return;

    const drawSegment = (key: any, lastAngle: any, angle: any) => {
      let value = "";

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
      ctx.lineWidth = 2;
      ctx.strokeStyle = "black";
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
    royalGames,
    isRoyal,
    apiType,
  ]);

  useEffect(() => {
    isStarted && spin();
  }, [isStarted, segments, spin]);

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
          if (isLoading || (isRoyal && !royalGames?.length)) return;

          dispatch(setFinished(false));
          dispatch(setWinner(undefined));

          if (isRoyal) {
            dispatch(
              setSegments(royalGames.map((game, i) => game.id + "_" + i))
            );

            isRemoved.current = false;
            return dispatch(setStarted(true));
          } else {
            if (apiType === "RA") {
              if (!games?.length) return;
              dispatch(setSegments(getSegments(games, segmentsLength)));
              dispatch(setStarted(true));
            }

            apiType === "IGDB" && dispatch(setLoading(true));
          }
        }}
      />
    </div>
  );
};

export default WheelComponent;