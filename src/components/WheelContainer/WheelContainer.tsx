import { FC, useEffect, useState } from "react";
import "react-wheel-of-prizes/dist/index.css";
import WheelComponent from "./WheelComponent";
import styles from "./WheelContainer.module.scss";
import { useAppDispatch, useAppSelector } from "../../store";
import { setRoyalGamesIGDB, setRoyalGamesRA } from "../../store/selectedSlice";
import classNames from "classnames";

const WheelContainer: FC = () => {
  const dispatch = useAppDispatch();

  const { winner, systemsIGDB, systemsRA } = useAppSelector(
    (state) => state.common
  );

  const { royalGamesRA, royalGamesIGDB, apiType, isRoyal } = useAppSelector(
    (state) => state.selected
  );

  const { isFinished, segments } = useAppSelector((state) => state.states);

  const [colors, setColors] = useState<string[]>([]);

  const royalGames = apiType === "RA" ? royalGamesRA : royalGamesIGDB;
  const setRoyalGames = apiType === "RA" ? setRoyalGamesRA : setRoyalGamesIGDB;

  const getLink = () => {
    return winner?.url || "";
  };

  const getImage = () => {
    return winner?.image || "";
  };

  const getTitle = () => {
    return winner?.name || "";
  };

  const getPlatform = () => {
    if (!winner?.platforms?.length) return "";

    const platforms = winner.platforms.reduce((result: string[], platform) => {
      const system = (apiType === "RA" ? systemsRA : systemsIGDB).find(
        (system) => system.id === platform
      );

      !!system && result.push(system.name);

      return result;
    }, []);

    return !!platforms?.length ? "Platform: " + platforms.join(", ") : "";
  };

  useEffect(() => {
    const generateRandomColors = (hue: number): string[] => {
      return segments.map((_, i) => {
        const min = 10;
        const percent =
          i < segments.length / 2
            ? (70 / segments.length) * i
            : (70 / segments.length) * (segments.length - i + 1);

        const lightness = (percent > min ? percent : min) + "%";
        const saturation = "60%";

        return `hsl(${hue}, ${saturation}, ${lightness})`;
      });
    };

    !!segments?.length &&
      setColors(generateRandomColors((180 + Math.random() * 90) ^ 0));
  }, [segments]);

  return (
    <div className={styles.container}>
      <WheelComponent
        segColors={colors}
        primaryColor="black"
        contrastColor="white"
        buttonText="Spin"
        size={295}
      />
      <div className={styles.winner}>
        <a
          className={classNames(styles.winner__container, {
            [styles.winner__container_active]: !!winner,
          })}
          href={getLink()}
          target="_blank"
          rel="noreferrer"
        >
          <div className={styles.winner__content}>
            <div
              className={classNames(styles.winner__image, {
                [styles.winner__image_active]: isFinished && getImage(),
              })}
              style={{
                ...(isFinished && { backgroundImage: `url(${getImage()})` }),
              }}
            />
            <div className={styles.winner__text}>
              <span className={styles.winner__link}>{getTitle()}</span>
              <span className={styles.winner__platform}>{getPlatform()}</span>
            </div>
          </div>
        </a>
      </div>
      <div className={styles.container__buttons}>
        {!!winner && isFinished && !isRoyal && (
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
