import { FC, useEffect, useState } from "react";
import styles from "./BGImage.module.scss";
import classNames from "classnames";
import Image from "next/image";
import { IGDBApi } from "../../api";
import { axiosUtils } from "../../utils/axios";
import { IGDBGameMinimal, IGDBScreenshot } from "../../types/igdb";
import { getImageLink } from "../../constants";
import { useDebouncedCallback } from "use-debounce";
import { useSettingsStore } from "../../store/settings.store";
import { useAuthStore } from "../../store/auth.store";

interface IBGImageProps {
  game?: IGDBGameMinimal;
  defaultImage?: string;
}

export const BGImage: FC<IBGImageProps> = ({
  game,
  defaultImage = "/images/moon.jpg",
}) => {
  const { bgOpacity } = useSettingsStore();

  const { profile } = useAuthStore();
  const [bg, setBg] = useState<IGDBScreenshot & { gameId: number }>();
  const [isImageReady, setIsImageReady] = useState(false);
  const [isAnimation, setIsAnimation] = useState(true);

  const debouncedSetImageReady = useDebouncedCallback((state: boolean) => {
    setIsImageReady(state);
    setIsAnimation(state);
  }, 300);

  useEffect(() => {
    if (!game) return;

    const pictures: number[] = [];

    if (!!game.artworks?.length) {
      game.artworks.forEach((id) => pictures.push(id));
    } else {
      game.screenshots.forEach((id) => pictures.push(id));
    }

    const id = pictures[Math.floor(Math.random() * (pictures.length - 1))];

    if (!id) return;

    (!!game.artworks?.length ? IGDBApi.getArtwork : IGDBApi.getScreenshot)(id)
      .then((res) => {
        setIsAnimation(false);
        setTimeout(() => {
          setBg({ ...res.data, gameId: game._id });
          setIsImageReady(false);
        }, 500);
      })
      .catch(axiosUtils.toastError);
  }, [game]);

  return (
    <div className={styles.bg__wrapper}>
      <div
        className={styles.bg__overlay}
        style={{ opacity: bgOpacity !== undefined ? bgOpacity / 100 : 0.7 }}
      />
      <div
        className={classNames(styles.bg, {
          [styles.bg_active]: isImageReady && isAnimation,
        })}
      >
        <Image
          onLoad={() => (!game || !!bg) && debouncedSetImageReady(true)}
          key={bg?._id}
          alt="Background"
          src={
            !!bg?.url
              ? getImageLink(bg.url, "1080p")
              : profile?.background || defaultImage
          }
          width={1920}
          height={1080}
        />
      </div>
    </div>
  );
};
