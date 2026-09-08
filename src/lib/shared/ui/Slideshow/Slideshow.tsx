import { FC, useCallback, useEffect, useMemo, useRef, useState } from "react";
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

  const shift = useCallback(
    (direction: 1 | -1) =>
      setScreenshotIndex((current) =>
        current === undefined || !screenshots.length
          ? current
          : (current + direction + screenshots.length) % screenshots.length
      ),
    [screenshots.length]
  );

  useEffect(() => {
    if (screenshotIndex === undefined) return;

    const keydownHandler = (event: KeyboardEvent) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

      const target = event.target as HTMLElement | null;

      if (target?.closest("input, textarea, [contenteditable]")) return;

      event.preventDefault();
      shift(event.key === "ArrowRight" ? 1 : -1);
    };

    document.addEventListener("keydown", keydownHandler);

    return () => document.removeEventListener("keydown", keydownHandler);
  }, [screenshotIndex, shift]);

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

            if (deltaX > SWIPE_THRESHOLD) {
              shift(-1);
            } else if (deltaX < -SWIPE_THRESHOLD) {
              shift(1);
            }
          }}
        >
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.slideshow__prev}
            tooltip="Previous screenshot"
            disabled={screenshots.length < 2}
            onClick={(e) => {
              e.stopPropagation();
              shift(-1);
            }}
          >
            <SvgChevron style={{ transform: "rotate(90deg)" }} />
          </Button>
          {screenshots[screenshotIndex]}
          <Button
            color={ButtonColor.TRANSPARENT}
            className={styles.slideshow__next}
            tooltip="Next screenshot"
            disabled={screenshots.length < 2}
            onClick={(e) => {
              e.stopPropagation();
              shift(1);
            }}
          >
            <SvgChevron style={{ transform: "rotate(-90deg)" }} />
          </Button>
        </div>,
        { onClose: () => setScreenshotIndex(undefined) }
      );
  }, [screenshotIndex, screenshots, shift]);

  return (
    <Scrollbar
      classNameContent={styles.slideshow__content}
      isHorizontal
      isWithArrows
    >
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
