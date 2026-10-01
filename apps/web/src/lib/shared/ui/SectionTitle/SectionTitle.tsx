import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./SectionTitle.module.scss";

interface ISectionTitleProps {
  children: ReactNode;
  as?: "h1" | "h2" | "h3" | "h4";
  variant?: "bar" | "pill" | "display";
  count?: number;
  action?: ReactNode;
  isWithMarginBottom?: boolean;
  className?: string;
}

export const SectionTitle: FC<ISectionTitleProps> = ({
  children,
  as: Tag = "h2",
  variant = "bar",
  count,
  action,
  isWithMarginBottom,
  className,
}) => {
  const marginClass = { [styles.title_marginBottom]: isWithMarginBottom };

  const heading = (
    <Tag
      className={classNames(
        styles.title,
        styles[`title_${variant}`],
        !action && marginClass,
        !action && className
      )}
    >
      {children}
      {typeof count === "number" && (
        <span className={styles.title__count}>({count})</span>
      )}
    </Tag>
  );

  if (!action) return heading;

  return (
    <div className={classNames(styles.row, marginClass, className)}>
      {heading}
      <div className={styles.row__action}>{action}</div>
    </div>
  );
};
