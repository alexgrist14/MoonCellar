import {
  ComponentProps,
  ComponentPropsWithRef,
  HTMLAttributeAnchorTarget,
  isValidElement,
  memo,
  MouseEventHandler,
  ReactNode,
  Ref,
} from "react";
import Link from "next/link";
import cl from "classnames";
import styles from "./Button.module.scss";
import { Tooltip } from "../Tooltip";
import { Loader } from "../Loader";

export enum ButtonColor {
  DEFAULT = "default",
  ACCENT = "accent",
  RED = "red",
  GREEN = "green",
  GREEN_BORDER = "greenBorder",
  TRANSPARENT = "transparent",
  FANCY = "fancy",
  SEGMENTED = "segmented",
  GHOST = "ghost",
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
  | "aria-expanded"
> {
  color?: IButtonColor;
  active?: boolean;
  tooltip?: string | ReactNode;
  tooltipAlign?: "left" | "right" | "center";
  compact?: boolean;
  hidden?: boolean;
  isOnlyIcon?: boolean;
  isAccentText?: boolean;
  isLoading?: boolean;
  href?: ComponentProps<typeof Link>["href"];
  target?: HTMLAttributeAnchorTarget;
  rel?: string;
  prefetch?: ComponentProps<typeof Link>["prefetch"];
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
    isOnlyIcon,
    isAccentText,
    isLoading,
    href,
    target,
    rel,
    prefetch,
    ref,
    disabled,
    type,
    form,
    onClick,
    ...props
  }: IButtonProps) => {
    const isSingleCharacter =
      (typeof children === "string" || typeof children === "number") &&
      [...String(children).trim()].length === 1;
    const isIconOnly =
      (isValidElement(children) && typeof children.type !== "string") ||
      isSingleCharacter;
    const isDisabled = disabled || isLoading;

    const commonProps = {
      ...props,
      "aria-label":
        props["aria-label"] ??
        (typeof tooltip === "string" ? tooltip : undefined),
      "aria-busy": isLoading || undefined,
      className: cl(styles.button, styles[`button_${color}Color`], className, {
        [styles.button_active]: active,
        [styles[`button_${color}Color_active`]]: active,
        [styles.button_compact]: compact,
        [styles.button_icon]: isIconOnly,
        [styles.button_square]: isOnlyIcon,
        [styles.button_accentText]: isAccentText,
        [styles.button_hidden]: hidden,
        [styles.button_loading]: isLoading,
        [styles.button_disabled]: href !== undefined && isDisabled,
      }),
    };

    const content = isLoading ? (
      <>
        <Loader type="pulse" color="currentColor" size="0.5em" />
        <span className={styles.button__label}>{children}</span>
      </>
    ) : (
      children
    );

    const button =
      href !== undefined ? (
        <Link
          {...commonProps}
          ref={ref as Ref<HTMLAnchorElement>}
          href={href}
          target={target}
          rel={rel}
          prefetch={prefetch}
          aria-disabled={isDisabled || undefined}
          tabIndex={isDisabled ? -1 : undefined}
          onClick={onClick as unknown as MouseEventHandler<HTMLAnchorElement>}
        >
          {content}
        </Link>
      ) : (
        <button
          {...commonProps}
          ref={ref}
          type={type}
          form={form}
          disabled={isDisabled}
          onClick={onClick}
        >
          {content}
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
