import { CSSProperties, FC } from "react";
import styles from "./Separator.module.scss";
import classNames from "classnames";

interface ISeparatorProps {
  direction?: "vertical" | "horizontal";
  style?: CSSProperties;
}

export const Separator: FC<ISeparatorProps> = ({
  direction = "vertical",
  style,
}) => {
  return (
    <div
      className={classNames(
        styles.separator,
        direction === "horizontal" && styles.separator_horizontal
      )}
      style={style}
    ></div>
  );
};
