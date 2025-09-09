import { memo, useEffect, useState } from "react";
import styles from "./BGImage.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { useDebouncedCallback } from "use-debounce";
import { useSettingsStore } from "../../store/settings.store";
import { IGameResponse } from "../../lib/schemas/games.schema";

interface IBGImageProps {
  game?: IGameResponse;
  defaultImage?: string;
}

export const BGImage = memo(
  ({ game, defaultImage = "/images/moon.jpg" }: IBGImageProps) => {
    const { bgOpacity } = useSettingsStore();

    const [bg, setBg] = useState<string>(defaultImage);
    const [prev, setPrev] = useState<string>(defaultImage);
    const [isImageReady, setIsImageReady] = useState(false);
    const [isDefaultReady, setIsDefaultReady] = useState(false);
    const [isAnimation, setIsAnimation] = useState(true);

    const debouncedSetImageReady = useDebouncedCallback((state: boolean) => {
      setIsImageReady(state);
      setIsAnimation(state);
    }, 300);

    useEffect(() => {
      if (!game) return;

      const pictures: string[] = [];

      if (!!game.artworks?.length) {
        game.artworks.forEach((url) => pictures.push(url));
      } else {
        game.screenshots?.forEach((url) => pictures.push(url));
      }

      const url = pictures[Math.floor(Math.random() * (pictures.length - 1))];

      if (!url) return;

      setPrev(bg);
      setIsAnimation(false);
      setTimeout(() => {
        setBg(url);
        setIsImageReady(false);
      }, 500);
      //eslint-disable-next-line react-hooks/exhaustive-deps
    }, [game]);

    return (
      <div className={styles.wrapper}>
        <div
          className={styles.overlay}
          style={{ opacity: bgOpacity !== undefined ? bgOpacity / 100 : 1 }}
        />
        <div className={styles.place}>
          {!!bg && (
            <div
              className={classNames(styles.bg, {
                [styles.bg_active]: isImageReady && isAnimation,
              })}
            >
              <Image
                onLoad={() => (!game || !!bg) && debouncedSetImageReady(true)}
                key={bg}
                alt="Background"
                src={bg}
                width={1920}
                height={1080}
              />
            </div>
          )}
          <div
            className={classNames(styles.bg, {
              [styles.bg_active]: isDefaultReady,
            })}
            style={{ zIndex: "-2" }}
          >
            <Image
              onLoad={() => setIsDefaultReady(true)}
              key={bg}
              alt="Background"
              src={prev}
              width={1920}
              height={1080}
            />
          </div>
        </div>
      </div>
    );
  }
);

BGImage.displayName = "BGImage";
