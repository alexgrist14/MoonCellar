import { FC, ReactNode } from "react";
import Link from "next/link";
import classNames from "classnames";
import styles from "./Chip.module.scss";

interface IChipProps {
  children: ReactNode;
  href?: string;
  isExternal?: boolean;
  variant?: "filled" | "outlined";
  className?: string;
  title?: string;
}

export const Chip: FC<IChipProps> = ({
  children,
  href,
  isExternal,
  variant = "filled",
  className,
  title,
}) => {
  const chipClassName = classNames(
    styles.chip,
    styles[`chip_${variant}`],
    className
  );

  if (!href) {
    return (
      <span className={chipClassName} title={title}>
        {children}
      </span>
    );
  }

  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noreferrer"
        className={chipClassName}
        title={title}
      >
        {children}
      </a>
    );
  }

  return (
    <Link href={href} className={chipClassName} title={title}>
      {children}
    </Link>
  );
};
