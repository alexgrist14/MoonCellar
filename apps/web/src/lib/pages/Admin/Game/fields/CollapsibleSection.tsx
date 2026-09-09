import { FC, ReactNode, useEffect, useState } from "react";
import cn from "classnames";
import styles from "./fields.module.scss";

interface ICollapsibleSectionProps {
  title: string;
  note?: string;
  isDefaultOpen?: boolean;
  hasError?: boolean;
  children: ReactNode;
}

export const CollapsibleSection: FC<ICollapsibleSectionProps> = ({
  title,
  note,
  isDefaultOpen,
  hasError,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(Boolean(isDefaultOpen));

  useEffect(() => {
    if (hasError) setIsOpen(true);
  }, [hasError]);

  return (
    <div
      className={cn(styles.section, { [styles.section_error]: hasError })}
    >
      <button
        type="button"
        className={styles.sectionHead}
        onClick={() => setIsOpen((prev) => !prev)}
      >
        <span>{title}</span>
        <span>{isOpen ? "−" : "+"}</span>
      </button>
      {isOpen && (
        <div className={styles.sectionBody}>
          {note && <p className={styles.note}>{note}</p>}
          {children}
        </div>
      )}
    </div>
  );
};
