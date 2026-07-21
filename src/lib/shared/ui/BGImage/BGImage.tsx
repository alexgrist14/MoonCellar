import { memo, useEffect, useMemo, useState } from "react";
import styles from "./BGImage.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { useDebouncedCallback } from "use-debounce";
import { useSettingsStore } from "../../store/settings.store";
import { useAuthStore } from "../../store/auth.store";
import { IGameResponse } from "../../lib/schemas/games.schema";
import { useHideAdult } from "../../hooks/useHideAdult";
import { isAdultGame } from "../../utils/adult.utils";

const DEFAULT_IMAGE = "/images/moon.jpg";

interface IBGImageProps {
  game?: IGameResponse;
  userImage?: string;
}

export const BGImage = memo(({ game, userImage }: IBGImageProps) => {
  const { bgOpacity } = useSettingsStore();
  const authUserImage = useAuthStore((s) => s.profile?.background);

  const hideMedia = useHideAdult() && isAdultGame(game);

  const gameImage = useMemo(() => {
    if (!game || hideMedia) return undefined;

    const pictures = game.artworks?.length ? game.artworks : game.screenshots;

    if (!pictures?.length) return undefined;

    return pictures[Math.floor(Math.random() * pictures.length)];
  }, [game, hideMedia]);

  const source = gameImage || userImage || authUserImage || DEFAULT_IMAGE;

  const [bg, setBg] = useState<string>(source);
  const [prev, setPrev] = useState<string>(source);
  const [isImageReady, setIsImageReady] = useState(false);
  const [isDefaultReady, setIsDefaultReady] = useState(false);
  const [isAnimation, setIsAnimation] = useState(true);

  const debouncedSetImageReady = useDebouncedCallback((state: boolean) => {
    setIsImageReady(state);
    setIsAnimation(state);
  }, 300);

  useEffect(() => {
    if (source === bg) return;

    setPrev(bg);
    setIsAnimation(false);
    setTimeout(() => {
      setBg(source);
      setIsImageReady(false);
    }, 500);
    //eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source]);

  return (
    <div className={styles.wrapper}>
      <div
        className={styles.overlay}
        style={{ opacity: bgOpacity !== undefined ? bgOpacity / 100 : 0 }}
      />
      <div className={styles.place}>
        {!!bg && (
          <div
            className={classNames(styles.bg, {
              [styles.bg_active]: isImageReady && isAnimation,
            })}
          >
            <Image
              onLoad={() => debouncedSetImageReady(true)}
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
            key={prev}
            alt="Background"
            src={prev}
            width={1920}
            height={1080}
          />
        </div>
      </div>
    </div>
  );
});

BGImage.displayName = "BGImage";
