import { FC, HTMLAttributes, ReactNode, Ref } from "react";
import classNames from "classnames";
import styles from "./Badge.module.scss";

export type BadgeTone =
  "neutral" | "attention" | "positive" | "negative" | "muted" | "accent";

interface IBadgeProps extends HTMLAttributes<HTMLSpanElement> {
  children: ReactNode;
  tone?: BadgeTone;
  size?: "sm" | "md";
  variant?: "soft" | "outlined";
  isWithDot?: boolean;
  isWrap?: boolean;
  isStruck?: boolean;
  ref?: Ref<HTMLSpanElement>;
}

export const Badge: FC<IBadgeProps> = ({
  children,
  tone = "neutral",
  size = "sm",
  variant = "soft",
  isWithDot,
  isWrap,
  isStruck,
  className,
  ref,
  ...rest
}) => (
  <span
    ref={ref}
    className={classNames(
      styles.badge,
      styles[`badge_${tone}`],
      styles[`badge_${size}`],
      {
        [styles.badge_dot]: isWithDot,
        [styles.badge_outlined]: variant === "outlined",
        [styles.badge_wrap]: isWrap,
        [styles.badge_struck]: isStruck,
      },
      className
    )}
    {...rest}
  >
    {children}
  </span>
);
