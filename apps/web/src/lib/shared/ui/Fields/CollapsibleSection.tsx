import { FC, ReactNode, useEffect, useState } from "react";
import cn from "classnames";
import { SvgChevron } from "@/src/lib/shared/ui/svg";
import styles from "./fields.module.scss";

interface ICollapsibleSectionProps {
  title: string;
  note?: string;
  isDefaultOpen?: boolean;
  isStatic?: boolean;
  hasError?: boolean;
  isKeptMounted?: boolean;
  children: ReactNode;
}

export const CollapsibleSection: FC<ICollapsibleSectionProps> = ({
  title,
  note,
  isDefaultOpen,
  isStatic,
  hasError,
  isKeptMounted,
  children,
}) => {
  const [isOpen, setIsOpen] = useState(Boolean(isDefaultOpen));

  useEffect(() => {
    if (hasError) setIsOpen(true);
  }, [hasError]);

  const isBodyShown = isStatic || isOpen;

  return (
    <div className={cn(styles.section, { [styles.section_error]: hasError })}>
      {isStatic ? (
        <div className={styles.sectionHead}>
          <span>{title}</span>
        </div>
      ) : (
        <button
          type="button"
          className={styles.sectionHead}
          aria-expanded={isOpen}
          onClick={() => setIsOpen((prev) => !prev)}
        >
          <span>{title}</span>
          <SvgChevron
            size="16"
            className={cn(styles.sectionChevron, {
              [styles.sectionChevron_open]: isOpen,
            })}
          />
        </button>
      )}
      {(isBodyShown || isKeptMounted) && (
        <div className={styles.sectionBody} hidden={!isBodyShown}>
          {note && <p className={styles.note}>{note}</p>}
          {children}
        </div>
      )}
    </div>
  );
};
