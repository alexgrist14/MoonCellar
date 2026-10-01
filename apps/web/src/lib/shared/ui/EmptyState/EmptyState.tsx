import { FC, ReactNode } from "react";
import cn from "classnames";
import styles from "./EmptyState.module.scss";
import { SvgEmptyList } from "../svg";

export type EmptyStateVariant = "default" | "compact" | "inline" | "page";

interface IEmptyStateProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  eyebrow?: ReactNode;
  variant?: EmptyStateVariant;
  as?: "p" | "h1" | "h2" | "h3" | "h4";
  isWithoutImage?: boolean;
  isCentered?: boolean;
  className?: string;
}

const ILLUSTRATED: EmptyStateVariant[] = ["default", "compact"];

export const EmptyState: FC<IEmptyStateProps> = ({
  title,
  description,
  icon,
  action,
  eyebrow,
  variant = "default",
  as: Title = "p",
  isWithoutImage,
  isCentered,
  className,
}) => {
  const image =
    icon ??
    (ILLUSTRATED.includes(variant) && (
      <SvgEmptyList color="secondary" className={styles.empty__illustration} />
    ));

  const isImageShown = !isWithoutImage && !!image;

  return (
    <div
      className={cn(
        styles.empty,
        styles[`empty_${variant}`],
        {
          [styles.empty_withoutImage]: !isImageShown,
          [styles.empty_centered]: isCentered,
        },
        className
      )}
    >
      {isImageShown && <div className={styles.empty__image}>{image}</div>}
      <div className={styles.empty__body}>
        {!!eyebrow && <p className={styles.empty__eyebrow}>{eyebrow}</p>}
        <Title className={styles.empty__title}>{title}</Title>
        {!!description && (
          <div className={styles.empty__description}>{description}</div>
        )}
        {!!action && <div className={styles.empty__action}>{action}</div>}
      </div>
    </div>
  );
};
