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
  id?: string;
  className?: string;
  style?: CSSProperties;
  size?: ISvgSizes;
  color?: ISvgColors;
  ref?: Ref<SVGSVGElement>;
  isDisableStyle?: boolean;
}

export type ISvgColorsProps = Omit<ISvgBaseProps, "color">;

interface ISvgProps extends ISvgBaseProps, PropsWithChildren {
  transform?: string;
  viewBox?: string;
}

export const Svg: FC<ISvgProps> = ({
  size = "20",
  children,
  color = "contrast",
  className,
  style,
  transform,
  ref,
  viewBox,
  isDisableStyle,
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
      style-default={isDisableStyle ? "true" : undefined}
      className={cn(styles.icon, className)}
      {...props}
    >
      {children}
    </svg>
  );
};

interface IPathProps extends Pick<
  SVGAttributes<SVGPathElement>,
  | "d"
  | "strokeLinejoin"
  | "strokeLinecap"
  | "strokeDasharray"
  | "clipPath"
  | "className"
  | "opacity"
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
  strokeDasharray,
  strokeWidth,
  color,
  clipPath,
  className,
  opacity,
}) => (
  <path
    strokeWidth={strokeWidth}
    strokeDasharray={strokeDasharray}
    opacity={opacity}
    fillRule={defaultFillRule ? undefined : "evenodd"}
    clipRule={defaultClipRule ? undefined : "evenodd"}
    d={d}
    {...{ [type]: color ?? "currentColor" }}
    strokeLinejoin={strokeLinejoin}
    strokeLinecap={strokeLinecap}
    clipPath={clipPath}
    className={className}
  />
);
