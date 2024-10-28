import { FC, useEffect, useState } from "react";
import styles from "./Slideshow.module.scss";
import { Scrollbar } from "../Scrollbar";
import { modal } from "../Modal";
import Image from "next/image";
import { IGDBScreenshot } from "../../types/igdb";
import { getImageLink } from "../../constants";
import { PulseLoader } from "react-spinners";
import { Loader } from "../Loader";

interface ISlideshowProps {
  pictures: IGDBScreenshot[];
}

export const Slideshow: FC<ISlideshowProps> = ({ pictures }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [screenshot, setScreenshot] = useState<IGDBScreenshot>();

  useEffect(() => {
    modal.close();

    !!screenshot &&
      modal.open(
        <div
          className={styles.slideshow__wrapper}
          onClick={() => modal.close()}
        >
          {isLoading && <Loader />}
          <Image
            onLoadingComplete={() => setIsLoading(false)}
            key={screenshot._id}
            width={1920}
            height={1080}
            alt="screenshot"
            src={getImageLink(screenshot.url, "1080p", 2)}
          />
        </div>
      );
  }, [isLoading, screenshot]);

  return (
    <Scrollbar stl={styles} isHorizontal>
      {pictures.map(
        (picture, i) =>
          !!picture.url && (
            <div
              key={i}
              className={styles.slideshow__screenshot}
              onClick={() => {
                setIsLoading(true);
                setScreenshot(picture);
              }}
            >
              <Image
                key={picture._id}
                alt="screenshot"
                width={889}
                height={500}
                src={getImageLink(picture.url, "screenshot_big")}
                priority
              />
            </div>
          )
      )}
    </Scrollbar>
  );
};
