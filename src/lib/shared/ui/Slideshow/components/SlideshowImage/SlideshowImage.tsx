import { FC, useState } from "react";
import styles from "./SlideshowImage.module.scss";
import Image from "next/image";
import classNames from "classnames";
import { Loader } from "../../../Loader";

export const SlideshowImage: FC<{ picture: string }> = ({ picture }) => {
  const [isLoading, setIsLoading] = useState(!!picture);

  return (
    <>
      {isLoading && <Loader />}
      <Image
        onLoad={() => setIsLoading(false)}
        className={classNames(styles.image, {
          [styles.image_active]: !isLoading,
        })}
        draggable={false}
        alt="screenshot"
        width={1920}
        height={1080}
        src={picture}
      />
    </>
  );
};
