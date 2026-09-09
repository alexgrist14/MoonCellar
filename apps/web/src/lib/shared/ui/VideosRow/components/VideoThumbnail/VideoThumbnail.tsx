import { FC, useState } from "react";
import styles from "./VideoThumbnail.module.scss";
import Image from "next/image";
import classNames from "classnames";
import { SvgVideoPlay } from "../../../svg";
import { Loader } from "../../../Loader";
import { getYoutubeThumbnailUrl } from "../../../../utils/youtube.utils";

export const VideoThumbnail: FC<{ video: string }> = ({ video }) => {
  const [isLoading, setIsLoading] = useState(true);

  return (
    <>
      {isLoading && <Loader />}
      <Image
        onLoad={() => setIsLoading(false)}
        className={classNames(styles.image, {
          [styles.image_active]: !isLoading,
        })}
        draggable={false}
        alt="video thumbnail"
        width={1920}
        height={1080}
        src={getYoutubeThumbnailUrl(video)}
      />
      {!isLoading && <SvgVideoPlay className={styles.play} />}
    </>
  );
};
