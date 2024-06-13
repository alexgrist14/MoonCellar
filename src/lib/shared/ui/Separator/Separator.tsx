import { CSSProperties, FC } from "react";
import styles from "./Separator.module.scss";

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
      className={styles.separator}
      style={{ rotate: direction === "vertical" ? "0" : "90deg", ...style }}
    ></div>
  );
};
