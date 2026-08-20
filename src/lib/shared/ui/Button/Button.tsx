import { memo, ReactNode, ComponentPropsWithRef } from "react";
import cl from "classnames";
import styles from "./Button.module.scss";
import { Tooltip } from "../Tooltip";

export enum ButtonColor {
  DEFAULT = "default",
  ACCENT = "accent",
  RED = "red",
  GREEN = "green",
  GREEN_BORDER = "greenBorder",
  TRANSPARENT = "transparent",
  FANCY = "fancy",
}

type IButtonColor = ButtonColor | `${ButtonColor}`;

export interface IButtonProps extends Pick<
  ComponentPropsWithRef<"button">,
  | "children"
  | "disabled"
  | "type"
  | "className"
  | "onClick"
  | "form"
  | "style"
  | "ref"
> {
  color?: IButtonColor;
  active?: boolean;
  tooltip?: string | ReactNode;
  tooltipAlign?: "left" | "right" | "center";
  compact?: boolean;
  hidden?: boolean;
}

export const Button = memo(
  ({
    children,
    className,
    active,
    tooltip,
    color = ButtonColor.DEFAULT,
    tooltipAlign,
    compact,
    hidden,
    ref,
    ...props
  }: IButtonProps) => {
    const button = (
      <button
        {...props}
        ref={ref}
        className={cl(
          styles.button,
          styles[`button_${color}Color`],
          className,
          {
            [styles.button_active]: active,
            [styles[`button_${color}Color_active`]]: active,
            [styles.button_compact]: compact,
            [styles.button_hidden]: hidden,
          }
        )}
      >
        {children}
      </button>
    );

    if (!tooltip) return button;

    return (
      <Tooltip
        content={tooltip}
        align={
          tooltipAlign === "left"
            ? "start"
            : tooltipAlign === "right"
              ? "end"
              : "center"
        }
      >
        {button}
      </Tooltip>
    );
  }
);

Button.displayName = "Button";
