import { FC } from "react";
import styles from "./Slideshow.module.scss";
import { Scrollbar } from "../Scrollbar";
import { modal } from "../Modal";
import Image from "next/image";
import { IGDBScreenshot } from "../../types/igdb";
import { getImageLink } from "../../constants";

interface ISlideshowProps {
  pictures: IGDBScreenshot[];
}

export const Slideshow: FC<ISlideshowProps> = ({ pictures }) => {
  return (
    <Scrollbar stl={styles} isHorizontal>
      {pictures.map(
        (picture, i) =>
          !!picture.url && (
            <div
              key={i}
              className={styles.slideshow__screenshot}
              onClick={() =>
                modal.open(
                  <div
                    className={styles.slideshow__wrapper}
                    onClick={() => modal.close()}
                  >
                    <Image
                      key={picture._id}
                      width={1920}
                      height={1080}
                      alt="screenshot"
                      src={getImageLink(picture.url, "1080p", 2)}
                    />
                  </div>
                )
              }
            >
              <Image
                key={picture._id}
                alt="screenshot"
                width={889}
                height={500}
                src={getImageLink(picture.url, "screenshot_big")}
              />
            </div>
          )
      )}
    </Scrollbar>
  );
};
