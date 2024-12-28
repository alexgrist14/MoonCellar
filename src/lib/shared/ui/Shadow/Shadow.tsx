import { CSSProperties, FC } from "react";
import styles from "./Shadow.module.scss";
import classNames from "classnames";

interface IShadowProps {
  isActive: boolean;
  isFixed?: boolean;
  style?: CSSProperties;
}

export const Shadow: FC<IShadowProps> = ({ isActive, isFixed, style }) => {
  return (
    <div
      style={{ ...style, position: isFixed ? "fixed" : "absolute" }}
      className={classNames(styles.shadow, {
        [styles.shadow_active]: isActive,
      })}
    />
  );
};
