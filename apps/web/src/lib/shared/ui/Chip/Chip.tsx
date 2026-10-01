import { FC, ReactNode } from "react";
import Link from "next/link";
import classNames from "classnames";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import styles from "./Chip.module.scss";

interface IChipProps {
  children: ReactNode;
  href?: string;
  isExternal?: boolean;
  isNoFollow?: boolean;
  variant?: "filled" | "outlined";
  className?: string;
  title?: string;
  onRemove?: () => void;
  removeLabel?: string;
  isDisabled?: boolean;
}

export const Chip: FC<IChipProps> = ({
  children,
  href,
  isExternal,
  isNoFollow,
  variant = "filled",
  className,
  title,
  onRemove,
  removeLabel,
  isDisabled,
}) => {
  const chipClassName = classNames(
    styles.chip,
    styles[`chip_${variant}`],
    className
  );

  const renderContent = (linkClassName?: string, linkTitle?: string) => {
    if (!href) return children;

    if (isExternal) {
      return (
        <a
          href={href}
          target="_blank"
          rel={isNoFollow ? "nofollow noreferrer" : "noreferrer"}
          className={linkClassName}
          title={linkTitle}
        >
          {children}
        </a>
      );
    }

    return (
      <Link href={href} className={linkClassName} title={linkTitle}>
        {children}
      </Link>
    );
  };

  if (onRemove) {
    return (
      <span className={chipClassName} title={title}>
        {renderContent(styles.chip__link)}
        <button
          type="button"
          className={styles.chip__remove}
          aria-label={
            removeLabel ??
            (typeof children === "string" ? `Remove ${children}` : "Remove")
          }
          disabled={isDisabled}
          onClick={onRemove}
        >
          <SvgClose size="12" style={{ color: "inherit" }} />
        </button>
      </span>
    );
  }

  if (!href) {
    return (
      <span className={chipClassName} title={title}>
        {children}
      </span>
    );
  }

  return renderContent(chipClassName, title);
};
