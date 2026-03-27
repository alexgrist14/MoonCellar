import type {
  CSSProperties,
  FC,
  PropsWithChildren,
  Ref,
  SVGAttributes,
} from "react";
import cn from "classnames";
import styles from "./Svg.module.scss";
import { ISvgColors, ISvgSizes } from "../../../types/common.type";

export interface ISvgBaseProps {
  className?: string;
  style?: CSSProperties;
  size?: ISvgSizes;
  color?: ISvgColors;
  ref?: Ref<SVGSVGElement>;

  /** Флаг. Отключает изменение цвета в кнопках */
  defaultStyle?: boolean;
}

export type ISvgColorsProps = Omit<ISvgBaseProps, "color">;

interface ISvgProps extends ISvgBaseProps, PropsWithChildren {
  transform?: string;
  viewBox?: string;
}

export const Svg: FC<ISvgProps> = ({
  size = "16",
  children,
  color = "contrast",
  className,
  style,
  transform,
  ref,
  viewBox,
  defaultStyle,
  ...props
}) => {
  return (
    <svg
      ref={ref}
      width={size}
      height={size}
      viewBox={viewBox || `0 0 ${size} ${size}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        transform,
        color: `var(--color-${color})`,
        minWidth: size,
        minHeight: size,
        ...style,
      }}
      style-default={defaultStyle ? "true" : undefined}
      className={cn(styles.icon, className)}
      {...props}
    >
      {children}
    </svg>
  );
};

interface IPathProps extends Pick<
  SVGAttributes<SVGPathElement>,
  "d" | "strokeLinejoin" | "strokeLinecap"
> {
  type?: "fill" | "stroke";
  defaultFillRule?: boolean;
  defaultClipRule?: boolean;
  strokeWidth?: string | number;
  color?: string;
}

export const Path: FC<IPathProps> = ({
  d,
  type = "fill",
  defaultFillRule,
  defaultClipRule,
  strokeLinejoin,
  strokeLinecap,
  strokeWidth,
  color,
}) => (
  <path
    strokeWidth={strokeWidth}
    fillRule={defaultFillRule ? undefined : "evenodd"}
    clipRule={defaultClipRule ? undefined : "evenodd"}
    d={d}
    {...{ [type]: color ?? "currentColor" }}
    strokeLinejoin={strokeLinejoin}
    strokeLinecap={strokeLinecap}
  />
);
