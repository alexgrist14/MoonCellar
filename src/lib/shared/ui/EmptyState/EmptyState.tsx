import { FC } from "react";
import cn from "classnames";
import styles from "./EmptyState.module.scss";
import { SvgEmptyList } from "../svg";

interface IEmptyStateProps {
  title: string;
  description?: string;
  className?: string;
}

export const EmptyState: FC<IEmptyStateProps> = ({
  title,
  description,
  className,
}) => {
  return (
    <div className={cn(styles.empty, className)}>
      <SvgEmptyList color="secondary" className={styles.empty__image} />
      <p className={styles.empty__title}>{title}</p>
      {!!description && (
        <p className={styles.empty__description}>{description}</p>
      )}
    </div>
  );
};
