import { FC, useEffect, useMemo, useRef, useState } from "react";
import styles from "./Slideshow.module.scss";
import { Scrollbar } from "../Scrollbar";
import { modal } from "../Modal";
import { SvgChevron } from "../svg";
import { Button, ButtonColor } from "../Button";
import { SlideshowImage } from "./components/SlideshowImage";

interface ISlideshowProps {
  pictures: string[];
}

const SWIPE_THRESHOLD = 50;

export const Slideshow: FC<ISlideshowProps> = ({ pictures }) => {
  const [screenshotIndex, setScreenshotIndex] = useState<number>();
  const touchStartX = useRef<number | null>(null);
  const isSwipe = useRef(false);

  const screenshots = useMemo(
    () =>
      pictures.map((picture, i) => (
        <SlideshowImage key={picture + i} picture={picture} />
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
            if (isSwipe.current) {
              isSwipe.current = false;
              return;
            }

            modal.close();
            setScreenshotIndex(undefined);
          }}
          onTouchStart={(e) => {
            touchStartX.current = e.touches[0].clientX;
            isSwipe.current = false;
          }}
          onTouchMove={(e) => {
            if (
              touchStartX.current !== null &&
              Math.abs(e.touches[0].clientX - touchStartX.current) > 10
            ) {
              isSwipe.current = true;
            }
          }}
          onTouchEnd={(e) => {
            if (touchStartX.current === null) return;

            const deltaX = e.changedTouches[0].clientX - touchStartX.current;

            touchStartX.current = null;

            if (deltaX > SWIPE_THRESHOLD && screenshotIndex > 0) {
              setScreenshotIndex(screenshotIndex - 1);
            } else if (
              deltaX < -SWIPE_THRESHOLD &&
              screenshotIndex < screenshots.length - 1
            ) {
              setScreenshotIndex(screenshotIndex + 1);
            }
          }}
        >
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.slideshow__prev}
            disabled={screenshotIndex === 0}
            onClick={(e) => {
              e.stopPropagation();
              setScreenshotIndex(screenshotIndex - 1);
            }}
          >
            <SvgChevron style={{ transform: "rotate(90deg)" }} />
          </Button>
          {screenshots[screenshotIndex]}
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.slideshow__next}
            disabled={screenshotIndex === screenshots.length - 1}
            onClick={(e) => {
              e.stopPropagation();
              setScreenshotIndex(screenshotIndex + 1);
            }}
          >
            <SvgChevron style={{ transform: "rotate(-90deg)" }} />
          </Button>
        </div>,
        { onClose: () => setScreenshotIndex(undefined) }
      );
  }, [screenshotIndex, screenshots]);

  return (
    <Scrollbar classNameContent={styles.slideshow__content} isHorizontal>
      {pictures.map(
        (picture, i) =>
          !!picture && (
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
