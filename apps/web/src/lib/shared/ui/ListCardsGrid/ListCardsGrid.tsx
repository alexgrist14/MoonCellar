import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./ListCardsGrid.module.scss";

export const ListCardsGrid: FC<{ children: ReactNode; className?: string }> = ({
  children,
  className,
}) => (
  <div className={classNames(styles.wrapper, className)}>
    <div className={styles.grid}>{children}</div>
  </div>
);
