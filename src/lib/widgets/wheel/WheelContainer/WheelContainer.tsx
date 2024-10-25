import { FC, useEffect, useState } from "react";
import styles from "./WheelContainer.module.scss";
import classNames from "classnames";
import { WheelComponent } from "@/src/lib/features/wheel";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useSelectedStore } from "@/src/lib/shared/store/selected.store";

export const WheelContainer: FC = () => {
  const { winner, systems } = useCommonStore();

  const { isRoyal, royalGames, setRoyalGames } = useSelectedStore();

  const { isFinished, segments, isLoading } = useStatesStore();

  const [colors, setColors] = useState<string[]>([]);
  const [isMenuActive, setIsMenuActive] = useState(false);

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
      const system = systems?.find((system) => system._id === platform);

      !!system && result.push(system.name);

      return result;
    }, []);

    return !!platforms?.length ? "Platform: " + platforms.join(", ") : "";
  };

  useEffect(() => {
    const generateRandomColors = (hue: number): string[] => {
      return (
        segments?.map((_, i) => {
          const min = 10;
          const percent =
            i < segments.length / 2
              ? (70 / segments.length) * i
              : (70 / segments.length) * (segments.length - i + 1);

          const lightness = (percent > min ? percent : min) + "%";
          const saturation = "60%";

          return `hsl(${hue}, ${saturation}, ${lightness})`;
        }) || []
      );
    };

    segments?.some((segment) => !segment) &&
      setColors(generateRandomColors((200 + Math.random() * 20) ^ 0));
  }, [segments, isLoading]);

  return (
    <div className={styles.container}>
      <WheelComponent
        segColors={colors}
        primaryColor="black"
        contrastColor="white"
        buttonText={
          isLoading ? "Loading..." : !isFinished ? "Spinning..." : "Spin"
        }
        size={295}
      />
      <div className={styles.winner}>
        <div
          className={classNames(styles.winner__container, {
            [styles.winner__container_active]: !!winner,
          })}
          onMouseOver={() => setIsMenuActive(true)}
          onMouseOut={() => setIsMenuActive(false)}
        >
          <div
            className={classNames(styles.winner__buttons, {
              [styles.winner__buttons_active]: isMenuActive,
            })}
          >
            {!!winner && isFinished && !isRoyal && (
              <button
                onClick={() =>
                  setRoyalGames(
                    !!royalGames?.length
                      ? royalGames.some((game) => game.id === winner.id)
                        ? royalGames.filter((game) => game.id !== winner.id)
                        : [...royalGames, winner]
                      : [winner]
                  )
                }
              >
                <p>
                  {royalGames?.some((game) => game.id === winner.id)
                    ? "Remove from "
                    : "Add to "}
                  Battle Royal
                </p>
              </button>
            )}
            <a href={getLink()} target="_blank" rel="noreferrer">
              <p>Open in IGDB</p>
            </a>
          </div>
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
              <p className={styles.winner__link}>{getTitle()}</p>
              <p className={styles.winner__platform}>{getPlatform()}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
