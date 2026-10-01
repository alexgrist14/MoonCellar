import { FC } from "react";
import classNames from "classnames";
import styles from "./ScoreValue.module.scss";

export type IScoreValueSize = "inline" | "md" | "lg";

interface IScoreValueProps {
  value: number | string;
  max?: number;
  size?: IScoreValueSize;
  className?: string;
}

export const ScoreValue: FC<IScoreValueProps> = ({
  value,
  max = 10,
  size = "md",
  className,
}) => (
  <span
    className={classNames(styles.score, styles[`score_${size}`], className)}
  >
    {value}
    <span className={styles.score__scale}> / {max}</span>
  </span>
);
