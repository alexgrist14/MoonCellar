import { CSSProperties, FC, ReactNode } from "react";
import { BoxHead } from "./BoxHead";
import cn from "classnames";
import styles from "./Box.module.scss";
import { Scrollbar } from "../Scrollbar";
import { useResizeDetector } from "react-resize-detector";
import classNames from "classnames";

interface IBoxProps {
  children: ReactNode;
  title?: string;
  titleAction?: ReactNode;
  wrapperStyle?: CSSProperties;
  templateStyle?: CSSProperties;
  contentStyle?: CSSProperties;
  isHeaderWithoutStyles?: boolean;
  isVerticalActions?: boolean;
  className?: string;
  classNameContent?: string;
  isWithScrollBar?: boolean;
  isWithBlur?: boolean;
  isWithoutBorder?: boolean;
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
  scrollFadeType,
  ...headProps
}) => {
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  return (
    <div className={cn(styles.wrapper, className)} style={wrapperStyle}>
      <BoxHead {...headProps} isExternal />
      <div
        style={templateStyle}
        className={cn(styles.template, {
          [styles.template_borderless]: isWithoutBorder,
          [styles.template_blur]: isWithBlur,
        })}
      >
        <BoxHead {...headProps} />
        <div ref={ref}>
          {isWithScrollBar ? (
            <Scrollbar
              type="absolute"
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
    </div>
  );
};
