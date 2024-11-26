import { FC, useEffect, useMemo, useState } from "react";
import styles from "./Slideshow.module.scss";
import { Scrollbar } from "../Scrollbar";
import { modal } from "../Modal";
import { IGDBScreenshot } from "../../types/igdb";
import { Icon } from "@iconify/react/dist/iconify.js";
import { Button } from "../Button";
import { SlideshowImage } from "./components/SlideshowImage";

interface ISlideshowProps {
  pictures: IGDBScreenshot[];
}

export const Slideshow: FC<ISlideshowProps> = ({ pictures }) => {
  const [screenshotIndex, setScreenshotIndex] = useState<number>();

  const screenshots = useMemo(
    () =>
      pictures.map((picture) => (
        <SlideshowImage key={picture._id} picture={picture} />
      )),
    [pictures]
  );

  useEffect(() => {
    modal.close();

    screenshotIndex !== undefined &&
      modal.open(
        <div
          className={styles.slideshow__wrapper}
          onClick={() => {
            modal.close();
            setScreenshotIndex(undefined);
          }}
        >
          <Button
            color="transparent"
            className={styles.slideshow__prev}
            disabled={screenshotIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              setScreenshotIndex(screenshotIndex - 1);
            }}
          >
            <Icon icon={"ooui:previous-ltr"} />
          </Button>
          {screenshots[screenshotIndex]}
          <Button
            color="transparent"
            className={styles.slideshow__next}
            disabled={screenshotIndex === screenshots.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setScreenshotIndex(screenshotIndex + 1);
            }}
          >
            <Icon icon={"ooui:previous-rtl"} />
          </Button>
        </div>,
        { onClose: () => setScreenshotIndex(undefined) }
      );
  }, [screenshotIndex, screenshots]);

  return (
    <Scrollbar stl={styles} isHorizontal>
      {pictures.map(
        (picture, i) =>
          !!picture.url && (
            <div
              key={i}
              className={styles.slideshow__screenshot}
              onClick={() => {
                setScreenshotIndex(i);
              }}
            >
              {screenshots[i]}
            </div>
          )
      )}
    </Scrollbar>
  );
};
