import { FC, ReactNode } from "react";
import classNames from "classnames";
import styles from "./SectionTitle.module.scss";

interface ISectionTitleProps {
  children: ReactNode;
  as?: "h2" | "h3" | "h4";
  variant?: "bar" | "pill";
  isWithMarginBottom?: boolean;
  className?: string;
}

export const SectionTitle: FC<ISectionTitleProps> = ({
  children,
  as: Tag = "h2",
  variant = "bar",
  isWithMarginBottom,
  className,
}) => {
  return (
    <Tag
      className={classNames(
        styles.title,
        styles[`title_${variant}`],
        {
          [styles.title_marginBottom]: isWithMarginBottom,
        },
        className
      )}
    >
      {children}
    </Tag>
  );
};
