import { FC, useEffect, useRef, useState } from "react";
import styles from "./WheelComponent.module.scss";
import classNames from "classnames";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { emptyGames } from "@/src/lib/shared/constants/games.const";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { useWheel } from "@/src/lib/shared/hooks/useWheel";
import { shuffle } from "@/src/lib/shared/utils/common.utils";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";
import { useSettingsStore } from "@/src/lib/shared/store/settings.store";
import { SvgWheelPointer } from "@/src/lib/shared/ui/svg";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";

interface WheelComponentProps {
  primaryColor?: string;
  contrastColor?: string;
  buttonText: string;
  fontFamily?: string;
  time?: number;
}

const SPIN_EASING = "cubic-bezier(0.23, 1, 0.32, 1)";
const BOUNCE_EASING = "cubic-bezier(0.45, 0, 0.55, 1)";
const BOUNCE_BACK_DEG_MIN = 60;
const BOUNCE_BACK_DEG_MAX = 180;
const BOUNCE_DURATION = 0.7;
const WINNER_REVEAL_DELAY = 300;
const MUSIC_FADE_OUT_DURATION = 600;

const MUSIC_TRACKS = [
  "/music/music_1.mp3",
  "/music/music_2.mp3",
  "/music/music_3.mp3",
  "/music/music_4.mp3",
];

const fadeOutAndPause = (audio: HTMLAudioElement, duration: number) => {
  const steps = 20;
  const stepTime = duration / steps;
  const volumeStep = audio.volume / steps;

  const interval = setInterval(() => {
    audio.volume = Math.max(0, audio.volume - volumeStep);

    if (audio.volume <= 0) {
      clearInterval(interval);
      audio.pause();
    }
  }, stepTime);
};

export const WheelComponent: FC<WheelComponentProps> = ({
  buttonText = "Spin",
  contrastColor = "white",
  fontFamily = "pentagra",
  primaryColor = "black",
  time = 3,
}) => {
  const setWinner = useWheelStore((state) => state.setWinner);

  const { addHistoryGame, games, royalGames } = useGamesStore();
  const { isFinished, isLoading, isStarted, setFinished, setStarted, isRoyal } =
    useStatesStore();
  const isMusicEnabled = useSettingsStore((state) => state.isMusicEnabled);
  const musicVolume = useSettingsStore((state) => state.musicVolume ?? 1);
  const isBounceBackEnabled = useSettingsStore(
    (state) => state.isBounceBackEnabled
  );

  const { data: royalGamesData } = useGamesByIdsQuery(royalGames || []);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const angle = useRef(0);
  const skipNextRoyalRedrawRef = useRef(false);
  const [winnerAngle, setWinnerAngle] = useState(0);
  const [rotateTransition, setRotateTransition] = useState(
    `rotate ${time}s ${SPIN_EASING}`
  );
  const [tempGames, setTempGames] = useState<IGameResponse[]>([]);

  const { drawWheel, parseImages, spinHandler, highlightWinner } = useWheel({
    contrastColor,
    fontFamily,
    primaryColor,
  });

  useEffect(() => {
    const wheelGames = isRoyal ? tempGames : games;

    if (isStarted && !!wheelGames?.length) {
      const winner = Math.floor(Math.random() * wheelGames.length);

      angle.current += 360 + 360 * Math.ceil(time);

      const finalAngle =
        angle.current +
        (360 - (360 / wheelGames.length) * winner) -
        Math.floor(Math.random() * (360 / wheelGames.length));

      setStarted(false);

      const finishSpin = () => {
        setFinished(true);

        if (isRoyal) {
          const filtered = tempGames?.filter(
            (game) => game._id !== tempGames[winner]._id
          );

          skipNextRoyalRedrawRef.current = true;
          setTempGames(
            !!filtered?.length
              ? filtered
              : !!royalGamesData?.length
                ? shuffle(royalGamesData)
                : []
          );
        } else {
          addHistoryGame(wheelGames[winner]);
        }

        setWinner(wheelGames[winner]);
        highlightWinner(wheelGames[winner]._id);
      };

      setRotateTransition(`rotate ${time}s ${SPIN_EASING}`);

      if (isBounceBackEnabled) {
        const bounceBackDeg =
          BOUNCE_BACK_DEG_MIN +
          Math.random() * (BOUNCE_BACK_DEG_MAX - BOUNCE_BACK_DEG_MIN);

        setWinnerAngle(finalAngle + bounceBackDeg);

        setTimeout(() => {
          setRotateTransition(`rotate ${BOUNCE_DURATION}s ${BOUNCE_EASING}`);
          setWinnerAngle(finalAngle);

          setTimeout(finishSpin, BOUNCE_DURATION * 1000);
        }, time * 1000);
      } else {
        setWinnerAngle(finalAngle);

        setTimeout(finishSpin, time * 1000);
      }
    }
  }, [
    isRoyal,
    isStarted,
    time,
    isBounceBackEnabled,
    setFinished,
    setStarted,
    setWinner,
    addHistoryGame,
    games,
    tempGames,
    royalGamesData,
    highlightWinner,
  ]);

  useEffect(() => {
    if (!isMusicEnabled || isFinished) return;

    const track = MUSIC_TRACKS[Math.floor(Math.random() * MUSIC_TRACKS.length)];
    const audio = new Audio(track);

    audio.loop = true;
    audio.volume = musicVolume;
    audio.play().catch(() => {});

    audioRef.current = audio;

    return () => {
      audioRef.current = null;

      // matches GameCard's cover fade-in duration so music covers the winner reveal
      setTimeout(
        () => fadeOutAndPause(audio, MUSIC_FADE_OUT_DURATION),
        WINNER_REVEAL_DELAY
      );
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinished, isMusicEnabled]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    isRoyal
      ? setTempGames(!!royalGamesData?.length ? shuffle(royalGamesData) : [])
      : setTempGames([]);
  }, [isRoyal, royalGamesData]);

  useEffect(() => {
    if (skipNextRoyalRedrawRef.current) {
      skipNextRoyalRedrawRef.current = false;
      return;
    }

    if (isRoyal) {
      parseImages(tempGames).then((images) => {
        drawWheel({
          wheelGames: tempGames,
          images: images
            .filter((i) => i.status === "fulfilled")
            .map((i) => i.value),
        });
      });
    } else {
      drawWheel({
        wheelGames: emptyGames,
      });
    }
  }, [drawWheel, parseImages, isRoyal, tempGames]);

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
          onClick={() => spinHandler(tempGames)}
        >
          {buttonText}
        </button>
        {(isLoading || isStarted) && (
          <Loader type="moon" className={styles.wheel__loader} />
        )}
      </div>
      <SvgWheelPointer />
      <canvas
        id="wheel-canvas"
        className={styles.canvas}
        style={{
          rotate: `${winnerAngle}deg`,
          transition: rotateTransition,
        }}
      />
    </div>
  );
};
