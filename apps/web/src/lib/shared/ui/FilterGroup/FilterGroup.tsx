import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./FilterGroup.module.scss";

interface IFilterGroupProps {
  title: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}

export const FilterGroup: FC<IFilterGroupProps> = ({
  title,
  headerAction,
  children,
  className,
}) => (
  <div className={classNames(styles.group, className)}>
    {headerAction ? (
      <div className={styles.group__header}>
        <h4>{title}</h4>
        {headerAction}
      </div>
    ) : (
      <h4>{title}</h4>
    )}
    {children}
  </div>
);
