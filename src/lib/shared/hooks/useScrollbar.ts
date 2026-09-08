import {
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useCommonStore } from "../store/common.store";
import { useDebouncedCallback } from "use-debounce";
import { useWindowResizeAction } from "./useWindowResizeAction";

const toggleArrow = (arrow: HTMLButtonElement | null, isShown: boolean) => {
  if (!arrow) return;

  arrow.style.opacity = isShown ? "1" : "0";
  arrow.style.pointerEvents = isShown ? "auto" : "none";
};

const getThumbOffset = (
  scrolled: number,
  scrollOffset: number,
  trackSize: number,
  thumbSize: number
) => {
  const maxOffset = Math.max(0, trackSize - thumbSize);

  if (scrollOffset <= 0) return 0;

  return Math.min(maxOffset, (scrolled / scrollOffset) * maxOffset);
};

const toggleFade = (
  content: HTMLDivElement,
  side: "start" | "end",
  isShown: boolean
) => {
  content.style.setProperty(`--scroll-fade-${side}`, isShown ? "1" : "0");
};

export const useScrollbar = ({
  id,
  children,
  initialContentRef,
  isHorizontal,
  isResetScrollPosition,
  onScroll,
  onScrollBottom,
}: {
  id?: string;
  isHorizontal?: boolean;
  initialContentRef?: RefObject<HTMLDivElement | null>;
  children?: ReactNode;
  isResetScrollPosition?: boolean;
  onScroll?: ({
    scrollTop,
    scrollLeft,
  }: {
    scrollTop?: number;
    scrollLeft?: number;
  }) => void;
  onScrollBottom?: (isBottom: boolean) => void;
}) => {
  const { scrollPosition, setScrollPosition } = useCommonStore();

  const lineTop = useRef<HTMLDivElement>(null);
  const lineBottom = useRef<HTMLDivElement>(null);
  const arrowStart = useRef<HTMLButtonElement>(null);
  const arrowEnd = useRef<HTMLButtonElement>(null);

  const scrollTrackRef = useRef<HTMLDivElement>(null);
  const scrollThumbRef = useRef<HTMLDivElement>(null);
  const defaultContentRef = useRef<HTMLDivElement>(null);

  const contentRef = initialContentRef ?? defaultContentRef;

  const [thumbHeight, setThumbHeight] = useState(65);
  const [thumbWidth, setThumbWidth] = useState(65);
  const [trackSize, setTrackSize] = useState(0);

  const [startScrollTop, setStartScrollTop] = useState(0);
  const [startScrollLeft, setStartScrollLeft] = useState(0);
  const [startScrollPosition, setStartScrollPosition] = useState(0);

  const [isDragging, setIsDragging] = useState(false);
  const [isVisible, setIsVisible] = useState(true);

  const { pageDir, clientDir } = useMemo(() => {
    const clientDir: "clientX" | "clientY" = isHorizontal
      ? "clientX"
      : "clientY";
    const pageDir: "pageX" | "pageY" = isHorizontal ? "pageX" : "pageY";

    return { clientDir, pageDir };
  }, [isHorizontal]);

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
        onScroll?.({ scrollTop: scrollAmount });
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
        onScroll?.({ scrollLeft: scrollAmount });
      }
    },
    [thumbHeight, contentRef, thumbWidth, isHorizontal, onScroll]
  );

  const handleThumbMouseDown = useCallback(
    (e: React.MouseEvent | React.TouchEvent) => {
      if (!contentRef.current) return;

      e.preventDefault();
      e.stopPropagation();

      const { scrollTop, scrollLeft } = contentRef.current;

      if (e.type === "mousedown") {
        setStartScrollPosition((e as React.MouseEvent)[clientDir]);
      }

      if (e.type === "touchstart") {
        setStartScrollPosition(
          (e as React.TouchEvent).targetTouches[0][pageDir]
        );
      }

      setStartScrollLeft(scrollLeft);
      setStartScrollTop(scrollTop);
      setIsDragging(true);
    },
    [contentRef, clientDir, pageDir]
  );

  const handleThumbMouseUp = useCallback(() => {
    if (isDragging) {
      setIsDragging(false);
    }
  }, [isDragging]);

  const handleThumbMouseMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!contentRef.current || !isDragging) return;

      const { clientHeight, clientWidth, scrollHeight, scrollWidth } =
        contentRef.current;

      const client =
        (e as MouseEvent)[clientDir] ??
        (e as TouchEvent).targetTouches[0][pageDir];
      const delta =
        (client - startScrollPosition) *
        ((isHorizontal ? clientWidth : clientHeight) /
          (isHorizontal ? thumbWidth : thumbHeight));

      if (!isHorizontal) {
        const value = Math.min(
          startScrollTop + delta,
          scrollHeight - clientHeight
        );
        contentRef.current.scrollTop = value;
        onScroll?.({ scrollTop: value });
      } else {
        const value = Math.min(
          startScrollLeft + delta,
          scrollWidth - clientWidth
        );
        contentRef.current.scrollLeft = value;
        onScroll?.({ scrollLeft: value });
      }
    },
    [
      isDragging,
      isHorizontal,
      thumbHeight,
      contentRef,
      thumbWidth,
      startScrollTop,
      startScrollPosition,
      startScrollLeft,
      clientDir,
      pageDir,
      onScroll,
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

      onScroll?.({ scrollLeft, scrollTop });

      if (isHorizontal) {
        const scrollOffset = scrollWidth - clientWidth;
        const thumbOffset = getThumbOffset(
          scrollLeft,
          scrollOffset,
          trackSize,
          scrollThumbRef.current.offsetWidth
        );

        scrollThumbRef.current.style.left = `${thumbOffset}px`;

        if (lineTop.current)
          scrollLeft > 1
            ? (lineTop.current.style.opacity = "1")
            : (lineTop.current.style.opacity = "0");

        if (lineBottom.current)
          scrollLeft + 1 < scrollOffset
            ? (lineBottom.current.style.opacity = "1")
            : (lineBottom.current.style.opacity = "0");

        toggleArrow(arrowStart.current, scrollLeft > 1);
        toggleArrow(arrowEnd.current, scrollLeft + 1 < scrollOffset);

        toggleFade(contentRef.current, "start", scrollLeft > 1);
        toggleFade(contentRef.current, "end", scrollLeft + 1 < scrollOffset);
      } else {
        const scrollOffset = scrollHeight - clientHeight;
        const thumbOffset = getThumbOffset(
          scrollTop,
          scrollOffset,
          trackSize,
          scrollThumbRef.current.offsetHeight
        );

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
  }, [contentRef, trackSize, isHorizontal, onScrollBottom, onScroll]);

  const resizeHandler = useCallback(() => {
    if (contentRef.current && scrollTrackRef.current && !isHorizontal) {
      const { clientHeight, scrollHeight } = contentRef.current;
      const { offsetHeight: trackHeight } = scrollTrackRef.current;
      const thumbHeight = (clientHeight / scrollHeight) * trackHeight;

      setTrackSize(trackHeight);
      setThumbHeight(thumbHeight > 10 ? thumbHeight : 10);
    } else if (contentRef.current && scrollTrackRef.current && isHorizontal) {
      const { clientWidth, scrollWidth } = contentRef.current;
      const { offsetWidth: trackWidth } = scrollTrackRef.current;
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
        (contentRef.current.scrollTop = 0);
      isResetScrollPosition &&
        isHorizontal &&
        (contentRef.current.scrollLeft = 0);
    }
  }, [contentRef, isResetScrollPosition, children, isHorizontal]);

  useEffect(() => {
    if (contentRef.current && scrollTrackRef.current) {
      const ref = contentRef.current;

      ref.addEventListener("scroll", positionHandler);

      return () => {
        ref.removeEventListener("scroll", positionHandler);
      };
    }
  }, [trackSize, contentRef, positionHandler]);

  const visibilityHandler = useCallback(() => {
    if (!contentRef.current) return;

    const { scrollHeight, clientHeight, scrollWidth, clientWidth } =
      contentRef.current;

    setIsVisible(
      isHorizontal ? scrollWidth !== clientWidth : scrollHeight !== clientHeight
    );
  }, [contentRef, isHorizontal]);

  useEffect(() => {
    visibilityHandler();
  }, [visibilityHandler, children]);

  useEffect(() => {
    const content = contentRef.current;

    if (!content) return;

    const observer = new ResizeObserver(() => {
      resizeHandler();
      positionHandler();
      visibilityHandler();
    });

    observer.observe(content);

    return () => observer.disconnect();
  }, [contentRef, resizeHandler, positionHandler, visibilityHandler]);

  useEffect(() => {
    if (!!id && !!scrollPosition?.[id]) {
      const tempScrollPosition = structuredClone(scrollPosition);

      contentRef.current?.scrollTo({
        ...tempScrollPosition[id],
        behavior: "smooth",
      });

      delete tempScrollPosition[id];

      setScrollPosition(tempScrollPosition);
    }
  }, [scrollPosition, setScrollPosition, contentRef, id]);

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
  }, [handleThumbMouseUp, handleThumbMouseMove]);

  const scrollByStep = useCallback(
    (direction: 1 | -1) => {
      const content = contentRef.current;

      if (!content) return;

      content.scrollBy({
        left: direction * content.clientWidth * 0.8,
        behavior: "smooth",
      });
    },
    [contentRef]
  );

  return {
    lineTop,
    lineBottom,
    arrowStart,
    arrowEnd,
    scrollByStep,
    isVisible,
    isDragging,
    scrollTrackRef,
    thumbHeight,
    thumbWidth,
    scrollThumbRef,
    handleTrackClick,
    handleThumbMouseDown,
    contentRef,
  };
};
