import { CSSProperties, FC, ReactNode, useRef } from "react";
import { BoxHead } from "./BoxHead";
import cn from "classnames";
import styles from "./Box.module.scss";
import { Scrollbar } from "../Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import classNames from "classnames";
import { ResizeHandle } from "../ResizeHandle";

interface IBoxProps {
  children: ReactNode;
  title?: string;
  titleAction?: ReactNode;
  wrapperStyle?: CSSProperties;
  templateStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  isHeaderWithoutStyles?: boolean;
  isVerticalActions?: boolean;
  isTitleStart?: boolean;
  className?: string;
  classNameContent?: string;
  isWithScrollBar?: boolean;
  isWithBlur?: boolean;
  isWithoutBorder?: boolean;
  isResizable?: boolean;
  scrollFadeType?: "both" | "top" | "bottom";
}

export const Box: FC<IBoxProps> = ({
  children,
  contentStyle,
  templateStyle,
  wrapperStyle,
  className,
  classNameContent,
  isWithScrollBar,
  isWithBlur,
  isWithoutBorder,
  isResizable,
  scrollFadeType,
  ...headProps
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  return (
    <div
      ref={wrapperRef}
      className={cn(styles.wrapper, { [styles.wrapper_resizable]: isResizable }, className)}
      style={wrapperStyle}
    >
      <BoxHead {...headProps} isExternal />
      <div
        style={templateStyle}
        className={cn(styles.template, {
          [styles.template_borderless]: isWithoutBorder,
          [styles.template_blur]: isWithBlur,
        })}
      >
        <BoxHead {...headProps} />
        <div ref={ref} className={styles.template__resizer}>
          {isWithScrollBar ? (
            <Scrollbar
              type="absolute"
              classNameContainer={styles.scrollbars__container}
              classNameContent={classNames(
                styles.scrollbars__content,
                classNameContent
              )}
              fadeType={scrollFadeType}
              contentStyle={contentStyle}
              classNameLine={styles.scrollbars__line}
              classNameScrollbar={styles.scrollbars__scrollbar}
            >
              {children}
            </Scrollbar>
          ) : (
            <div
              className={cn(classNameContent, styles.template__content)}
              style={contentStyle}
            >
              {children}
            </div>
          )}
        </div>
      </div>
      {isResizable && <ResizeHandle targetRef={wrapperRef} />}
    </div>
  );
};
