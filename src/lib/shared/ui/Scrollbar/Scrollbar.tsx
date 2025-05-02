import React, {
  CSSProperties,
  FC,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import cl from "classnames";
import styles from "./Scrollbar.module.scss";
import { useDebouncedCallback } from "use-debounce";
import { useWindowResizeAction } from "../../hooks";
import { useCommonStore } from "../../store/common.store";

interface IScrollBarProps {
  className?: string;
  classNameLine?: string;
  classNameContent?: string;
  contentDefRef?: React.MutableRefObject<any>;
  stl?: any;
  children?: React.ReactNode;
  isLine?: boolean;
  type?: "absolute";
  fadeType?: "both" | "top" | "bottom";
  isChildrenOnly?: boolean;
  isResetScrollPosition?: boolean;
  isHorizontal?: boolean;
  contentStyle?: CSSProperties;
  onScrollBottom?: (isBottom: boolean) => void;
}

export const Scrollbar: FC<IScrollBarProps> = ({
  className,
  classNameLine,
  classNameContent,
  contentDefRef,
  stl,
  children,
  isLine,
  type,
  fadeType,
  isChildrenOnly,
  isResetScrollPosition,
  isHorizontal,
  contentStyle,
  onScrollBottom,
}) => {
  const { scrollPosition, setScrollPosition } = useCommonStore();

  const lineTop = useRef<HTMLDivElement>(null);
  const lineBottom = useRef<HTMLDivElement>(null);

  const defaultWrapperRef = useRef<HTMLDivElement>(null);
  const contentRef = contentDefRef ?? defaultWrapperRef;

  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);

  const [thumbHeight, setThumbHeight] = useState(65);
  const [thumbWidth, setThumbWidth] = useState(65);
  const [trackSize, setTrackSize] = useState(0);
  const [scrollStartPosition, setScrollStartPosition] = useState<number | null>(
    null
  );
  const [initialScrollTop, setInitialScrollTop] = useState(0);
  const [initialScrollLeft, setInitialScrollLeft] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const handleTrackClick = useCallback(
    (e: React.MouseEvent) => {
      const { current: trackCurrent } = scrollTrackRef;
      const { current: contentCurrent } = contentRef;

      if (trackCurrent && contentCurrent && !isHorizontal) {
        const { clientY } = e;
        const target = e.target as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const trackTop = rect.top;
        const thumbOffset = -(thumbHeight / 2);
        const clickRatio =
          (clientY - trackTop + thumbOffset) / trackCurrent.clientHeight;
        const scrollAmount = Math.floor(
          clickRatio * contentCurrent.scrollHeight
        );

        contentCurrent.scrollTo({
          top: scrollAmount,
          behavior: "smooth",
        });
      } else if (trackCurrent && contentCurrent && isHorizontal) {
        const { clientX } = e;
        const target = e.target as HTMLDivElement;
        const rect = target.getBoundingClientRect();
        const trackLeft = rect.left;
        const thumbOffset = -(thumbWidth / 2);
        const clickRatio =
          (clientX - trackLeft + thumbOffset) / trackCurrent.clientWidth;
        const scrollAmount = Math.floor(
          clickRatio * contentCurrent.scrollWidth
        );

        contentCurrent.scrollTo({
          top: 0,
          left: scrollAmount,
          behavior: "smooth",
        });
      }
    },
    [thumbHeight, contentRef, thumbWidth, isHorizontal]
  );

  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      const clientDir = isHorizontal ? "clientX" : "clientY";
      const pageDir = isHorizontal ? "pageX" : "pageY";
      const scrollDir = isHorizontal ? "scrollLeft" : "scrollTop";
      const initialScrollSetter = isHorizontal
        ? setInitialScrollLeft
        : setInitialScrollTop;
      e.type === "mousedown" &&
        setScrollStartPosition((e as React.MouseEvent)[clientDir]);

      e.type === "touchstart" &&
        setScrollStartPosition(
          (e as React.TouchEvent).targetTouches[0][pageDir]
        );

      contentRef.current && initialScrollSetter(contentRef.current[scrollDir]);
      setIsDragging(true);
    },
    [contentRef, isHorizontal]
  );

  const handleThumbMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  const handleThumbMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (isDragging && scrollStartPosition && !isHorizontal) {
        const {
          scrollHeight: contentScrollHeight,
          offsetHeight: contentOffsetHeight,
        } = contentRef.current;

        const clientY =
          (e as MouseEvent).clientY ?? (e as TouchEvent).targetTouches[0].pageY;

        const deltaY =
          (clientY - scrollStartPosition) * (contentOffsetHeight / thumbHeight);

        const newScrollTop = Math.min(
          initialScrollTop + deltaY,
          contentScrollHeight - contentOffsetHeight
        );

        contentRef.current.scrollTop = newScrollTop;
      } else if (isDragging && scrollStartPosition && isHorizontal) {
        const {
          scrollWidth: contentScrollWidth,
          offsetWidth: contentOffsetWidth,
        } = contentRef.current;

        const clientX =
          (e as MouseEvent).clientX ?? (e as TouchEvent).targetTouches[0].pageX;

        const deltaX =
          (clientX - scrollStartPosition) * (contentOffsetWidth / thumbWidth);

        const newScrollLeft = Math.min(
          initialScrollLeft + deltaX,
          contentScrollWidth - contentOffsetWidth
        );

        contentRef.current.scrollLeft = newScrollLeft;
      }
    },
    [
      isDragging,
      scrollStartPosition,
      thumbHeight,
      contentRef,
      initialScrollTop,
      initialScrollLeft,
      thumbWidth,
      isHorizontal,
    ]
  );

  const positionHandler = useCallback(() => {
    if (contentRef.current && scrollThumbRef.current) {
      const {
        scrollTop,
        scrollLeft,
        scrollWidth,
        scrollHeight,
        clientHeight,
        clientWidth,
      } = contentRef.current;

      if (isHorizontal) {
        const leftOffset = (scrollLeft / scrollWidth) * trackSize;
        const scrollOffset = scrollWidth - clientWidth;
        const thumbOffset =
          leftOffset < trackSize - 10 ? leftOffset : trackSize - 10;

        scrollThumbRef.current.style.left = `${thumbOffset}px`;

        if (lineTop.current)
          scrollLeft > 1
            ? (lineTop.current.style.opacity = "1")
            : (lineTop.current.style.opacity = "0");

        if (lineBottom.current)
          scrollLeft + 1 < scrollOffset
            ? (lineBottom.current.style.opacity = "1")
            : (lineBottom.current.style.opacity = "0");
      } else {
        const topOffset = (scrollTop / scrollHeight) * trackSize;
        const scrollOffset = scrollHeight - clientHeight;
        const thumbOffset =
          topOffset < trackSize - 10 ? topOffset : trackSize - 10;

        !!onScrollBottom && onScrollBottom(scrollTop < scrollOffset - 10);

        scrollThumbRef.current.style.top = `${thumbOffset}px`;

        if (lineTop.current)
          scrollTop > 1
            ? (lineTop.current.style.opacity = "1")
            : (lineTop.current.style.opacity = "0");

        if (lineBottom.current)
          scrollTop + 1 < scrollOffset
            ? (lineBottom.current.style.opacity = "1")
            : (lineBottom.current.style.opacity = "0");
      }
    }
  }, [contentRef, trackSize, isHorizontal, onScrollBottom]);

  const resizeHandler = useCallback(() => {
    if (contentRef.current && scrollTrackRef.current && !isHorizontal) {
      const { clientHeight, scrollHeight } = contentRef.current;
      const { clientHeight: trackHeight } = scrollTrackRef.current;
      const thumbHeight = (clientHeight / scrollHeight) * trackHeight;

      setTrackSize(trackHeight);
      setThumbHeight(thumbHeight > 10 ? thumbHeight : 10);
    } else if (contentRef.current && scrollTrackRef.current && isHorizontal) {
      const { clientWidth, scrollWidth } = contentRef.current;
      const { clientWidth: trackWidth } = scrollTrackRef.current;
      const thumbWidth = (clientWidth / scrollWidth) * trackWidth;

      setTrackSize(trackWidth);

      setThumbWidth(thumbWidth > 10 ? thumbWidth : 10);
    }
  }, [contentRef, isHorizontal]);

  const debouncedResizeHandler = useDebouncedCallback(resizeHandler, 200);

  useWindowResizeAction(debouncedResizeHandler);

  useEffect(() => {
    if (contentRef.current && scrollTrackRef.current) {
      resizeHandler();
      positionHandler();
    }
  }, [contentRef, children, resizeHandler, positionHandler, isHorizontal]);

  useEffect(() => {
    if (contentRef.current) {
      isResetScrollPosition &&
        !isHorizontal &&
        (contentRef.current.scrollTop = "0");
      isResetScrollPosition &&
        isHorizontal &&
        (contentRef.current.scrollLeft = "0");
    }
  }, [contentRef, isResetScrollPosition, children, isHorizontal]);

  useEffect(() => {
    if (contentRef.current && scrollTrackRef.current) {
      const currentContentRef = contentRef.current;

      currentContentRef.addEventListener("scroll", positionHandler);

      return () => {
        currentContentRef.removeEventListener("scroll", positionHandler);
      };
    }
  }, [trackSize, contentRef, positionHandler]);

  useEffect(() => {
    const { scrollHeight, clientHeight, scrollWidth, clientWidth } =
      contentRef.current;

    if (isHorizontal) {
      setIsVisible(scrollWidth !== clientWidth);
    } else {
      setIsVisible(scrollHeight !== clientHeight);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [thumbHeight, thumbWidth]);

  useEffect(() => {
    if (!!scrollPosition) {
      contentRef.current.scrollTo({
        ...scrollPosition,
        behavior: "smooth",
      });

      setScrollPosition(undefined);
    }
  }, [scrollPosition, setScrollPosition, contentRef]);

  useEffect(() => {
    document.addEventListener("mousemove", handleThumbMouseMove);
    document.addEventListener("mouseup", handleThumbMouseUp);
    document.addEventListener("mouseleave", handleThumbMouseUp);

    document.addEventListener("touchmove", handleThumbMouseMove);
    document.addEventListener("touchend", handleThumbMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleThumbMouseMove);
      document.removeEventListener("mouseup", handleThumbMouseUp);
      document.removeEventListener("mouseleave", handleThumbMouseUp);

      document.removeEventListener("touchmove", handleThumbMouseMove);
      document.removeEventListener("touchend", handleThumbMouseUp);
    };
  }, [handleThumbMouseMove, handleThumbMouseUp]);

  return (
    <div
      className={cl(
        className,
        styles.scrollbars__container,
        stl && stl.scrollbars__container,
        isHorizontal && styles["scrollbars__container--horizontal"],
        {
          [styles.scrollbars__container_absolute]: type === "absolute",
        }
      )}
    >
      {!!fadeType && (isLine || ["both", "top"].includes(fadeType)) && (
        <div
          ref={lineTop}
          className={cl(
            classNameLine,
            styles.scrollbars__line,
            styles.scrollbars__line_top,
            {
              [styles.off]: !isVisible,
              [styles["scrollbars__line_top--horizontal"]]: isHorizontal,
            }
          )}
          data-line="top"
        />
      )}
      {isChildrenOnly && contentDefRef ? (
        children
      ) : (
        <div
          className={cl(
            classNameContent,
            styles.scrollbars__content,
            stl && stl.scrollbars__content
          )}
          style={contentStyle}
          ref={contentRef}
        >
          {children}
        </div>
      )}

      <div
        className={cl(
          styles.scrollbars__scrollbar,
          stl && stl.scrollbars__scrollbar,
          {
            [styles.off]: !isVisible,
            [styles.scrollbars__scrollbar_absolute]: type === "absolute",
          }
        )}
      >
        <div
          className={cl(
            styles.scrollbars__track,
            stl && stl.scrollbars__track,
            isHorizontal && styles["scrollbars__track--horizontal"]
          )}
          ref={scrollTrackRef}
          onClick={handleTrackClick}
          style={{ cursor: isDragging ? "grabbing" : "pointer" }}
        />
        <div
          className={cl(
            styles.scrollbars__thumb,
            stl && stl.scrollbars__thumb,
            isHorizontal && styles["scrollbars__thumb--horizontal"]
          )}
          ref={scrollThumbRef}
          onMouseDown={handleThumbMouseDown}
          onTouchStart={handleThumbMouseDown}
          style={{
            height: isHorizontal ? "8px" : `${thumbHeight}px`,
            width: isHorizontal ? `${thumbWidth}px` : undefined,
            cursor: isDragging ? "grabbing" : "grab",
          }}
        />
      </div>
      {!!fadeType && (isLine || ["both", "bottom"].includes(fadeType)) && (
        <div
          ref={lineBottom}
          className={cl(
            classNameLine,
            styles.scrollbars__line,
            styles.scrollbars__line_bottom,
            {
              [styles.off]: !isVisible,
              [styles["scrollbars__line_bottom--horizontal"]]: isHorizontal,
            }
          )}
          data-line="bottom"
        />
      )}
    </div>
  );
};
