'use client';

import React, { CSSProperties, FC, RefObject } from "react";
import cl from "classnames";
import styles from "./Scrollbar.module.scss";
import { useScrollbar } from "../../hooks";

interface IScrollBarProps {
  id?: string;
  ref?: RefObject<HTMLDivElement>;
  classNameLine?: string;
  classNameContent?: string;
  classNameContainer?: string;
  classNameThumb?: string;
  classNameTrack?: string;
  classNameScrollbar?: string;
  isLine?: boolean;
  type?: "absolute";
  fadeType?: "both" | "top" | "bottom";
  isChildrenOnly?: boolean;
  isResetScrollPosition?: boolean;
  isHorizontal?: boolean;
  contentStyle?: CSSProperties;
  containerStyle?: CSSProperties;
  initialContentRef?: RefObject<HTMLDivElement | null>;
  children?: React.ReactNode;
  isWithRadius?: boolean;
  onScroll?: ({
    scrollTop,
    scrollLeft,
  }: {
    scrollTop?: number;
    scrollLeft?: number;
  }) => void;
  onScrollBottom?: (isBottom: boolean) => void;
}

export const Scrollbar: FC<IScrollBarProps> = ({
  id,
  ref,
  classNameLine,
  classNameContent,
  classNameContainer,
  classNameThumb,
  classNameTrack,
  classNameScrollbar,
  children,
  isLine,
  type,
  fadeType,
  isChildrenOnly,
  isResetScrollPosition,
  isHorizontal,
  contentStyle,
  containerStyle,
  initialContentRef,
  isWithRadius,
  onScroll,
  onScrollBottom,
}) => {
  const {
    isVisible,
    isDragging,
    lineBottom,
    lineTop,
    contentRef,
    scrollTrackRef,
    thumbWidth,
    thumbHeight,
    scrollThumbRef,
    handleTrackClick,
    handleThumbMouseDown,
  } = useScrollbar({
    id,
    isResetScrollPosition,
    isHorizontal,
    initialContentRef,
    children,
    onScroll,
    onScrollBottom,
  });

  return (
    <div
      ref={ref}
      style={containerStyle}
      className={cl(
        classNameContainer,
        styles.scrollbars__container,
        isHorizontal && styles["scrollbars__container--horizontal"],
        {
          [styles.scrollbars__container_absolute]: type === "absolute",
        }
      )}
    >
      {isChildrenOnly ? (
        children
      ) : (
        <div
          className={cl(classNameContent, styles.scrollbars__content)}
          style={contentStyle}
          ref={contentRef}
        >
          {children}
        </div>
      )}

      <div
        className={cl(classNameScrollbar, styles.scrollbars__scrollbar, {
          [styles.off]: !isVisible,
          [styles.scrollbars__scrollbar_absolute]: type === "absolute",
        })}
      >
        <div
          className={cl(
            classNameTrack,
            styles.scrollbars__track,
            isHorizontal && styles["scrollbars__track--horizontal"]
          )}
          ref={scrollTrackRef}
          onClick={handleTrackClick}
          style={{ cursor: isDragging ? "grabbing" : "pointer" }}
        />
        <div
          className={cl(
            classNameThumb,
            styles.scrollbars__thumb,
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
      {!!fadeType && (isLine || ["both", "top"].includes(fadeType)) && (
        <div
          ref={lineTop}
          className={cl(
            classNameLine,
            styles.scrollbars__line,
            styles.scrollbars__line_top,
            {
              [styles.off]: !isVisible,
              [styles.scrollbars__line_radius]: isWithRadius,
              [styles["scrollbars__line_top--horizontal"]]: isHorizontal,
            }
          )}
          data-line="top"
        />
      )}
      {!!fadeType && (isLine || ["both", "bottom"].includes(fadeType)) && (
        <div
          ref={lineBottom}
          className={cl(
            classNameLine,
            styles.scrollbars__line,
            styles.scrollbars__line_bottom,
            {
              [styles.off]: !isVisible,
              [styles.scrollbars__line_radius]: isWithRadius,
              [styles["scrollbars__line_bottom--horizontal"]]: isHorizontal,
            }
          )}
          data-line="bottom"
        />
      )}
    </div>
  );
};
