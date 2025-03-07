import { CSSProperties, FC, ReactNode } from "react";
import { WrapperTemplateHead } from "./WrapperTemplateHead";
import cn from "classnames";
import styles from "./WrapperTemplate.module.scss";
import { Scrollbar } from "../Scrollbar";
import { useResizeDetector } from "react-resize-detector";

interface IWrapperTemplateProps {
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
}

export const WrapperTemplate: FC<IWrapperTemplateProps> = ({
  children,
  contentStyle,
  templateStyle,
  wrapperStyle,
  className,
  classNameContent,
  isWithScrollBar,
  isWithBlur,
  ...headProps
}) => {
  const { ref } = useResizeDetector({
    refreshMode: "debounce",
    refreshRate: 200,
  });

  return (
    <div className={cn(styles.wrapper, className)} style={wrapperStyle}>
      <WrapperTemplateHead {...headProps} isExternal />
      <div
        style={{
          backdropFilter: isWithBlur ? "blur(6px)" : undefined,
          ...templateStyle,
        }}
        className={styles.template}
      >
        <WrapperTemplateHead {...headProps} />
        <div
          ref={ref}
          style={contentStyle}
          className={cn(classNameContent, styles.template__content)}
        >
          {isWithScrollBar ? (
            <Scrollbar type="absolute" stl={styles}>
              {children}
            </Scrollbar>
          ) : (
            children
          )}
        </div>
      </div>
    </div>
  );
};
