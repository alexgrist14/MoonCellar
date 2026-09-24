import {
  ComponentPropsWithRef,
  Fragment,
  isValidElement,
  memo,
  ReactNode,
} from "react";
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
  SEGMENTED = "segmented",
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
  | "aria-label"
  | "aria-pressed"
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
    const isSingleCharacter =
      (typeof children === "string" || typeof children === "number") &&
      [...String(children).trim()].length === 1;
    const isIconOnly =
      (isValidElement(children) && typeof children.type !== "string") ||
      isSingleCharacter;
    const isSquare =
      isSingleCharacter ||
      (isValidElement<{ children?: unknown }>(children) &&
        typeof children.type !== "string" &&
        children.type !== Fragment &&
        children.props.children === undefined);

    const button = (
      <button
        {...props}
        aria-label={
          props["aria-label"] ??
          (typeof tooltip === "string" ? tooltip : undefined)
        }
        ref={ref}
        className={cl(
          styles.button,
          styles[`button_${color}Color`],
          className,
          {
            [styles.button_active]: active,
            [styles[`button_${color}Color_active`]]: active,
            [styles.button_compact]: compact,
            [styles.button_icon]: isIconOnly,
            [styles.button_square]: isSquare,
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
