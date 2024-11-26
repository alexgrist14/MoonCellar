import { FC, useState } from "react";
import styles from "./SlideshowImage.module.scss";
import Image from "next/image";
import classNames from "classnames";
import { getImageLink } from "@/src/lib/shared/constants";
import { IGDBScreenshot } from "@/src/lib/shared/types/igdb";
import { Loader } from "../../../Loader";

export const SlideshowImage: FC<{ picture: IGDBScreenshot }> = ({
  picture,
}) => {
  const [isLoading, setIsLoading] = useState(!!picture.url);

  return (
    <>
      {isLoading && <Loader />}
      <Image
        onLoad={() => setTimeout(() => setIsLoading(false), 200)}
        className={classNames(styles.image, {
          [styles.image_active]: !isLoading,
        })}
        draggable={false}
        alt="screenshot"
        width={1920}
        height={1080}
        src={getImageLink(picture.url, "1080p")}
        priority
      />
    </>
  );
};
