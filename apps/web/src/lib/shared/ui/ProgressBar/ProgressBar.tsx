import { FC, ProgressHTMLAttributes } from "react";
import classNames from "classnames";
import styles from "./ProgressBar.module.scss";

export type ProgressBarTone = "neutral" | "accent" | "attention" | "negative";

interface IProgressBarProps extends Omit<
  ProgressHTMLAttributes<HTMLProgressElement>,
  "value" | "max"
> {
  value?: number;
  max?: number;
  tone?: ProgressBarTone;
}

export const ProgressBar: FC<IProgressBarProps> = ({
  value,
  max = 1,
  tone = "neutral",
  className,
  ...rest
}) => (
  <progress
    className={classNames(styles.bar, styles[`bar_${tone}`], className)}
    value={value}
    max={max}
    {...rest}
  />
);
