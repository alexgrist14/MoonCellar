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
  aside?: ReactNode;
  isOpen?: boolean;
  onToggle?: (isOpen: boolean) => void;
  children: ReactNode;
}

export const CollapsibleSection: FC<ICollapsibleSectionProps> = ({
  title,
  note,
  isDefaultOpen,
  isStatic,
  hasError,
  isKeptMounted,
  aside,
  isOpen: controlledOpen,
  onToggle,
  children,
}) => {
  const [ownOpen, setOwnOpen] = useState(Boolean(isDefaultOpen));
  const isOpen = controlledOpen ?? ownOpen;

  useEffect(() => {
    if (hasError) setOwnOpen(true);
  }, [hasError]);

  const toggle = () => {
    setOwnOpen(!isOpen);
    onToggle?.(!isOpen);
  };

  const isBodyShown = isStatic || isOpen;

  return (
    <div className={cn(styles.section, { [styles.section_error]: hasError })}>
      {isStatic ? (
        <div className={styles.sectionHead}>
          <span>{title}</span>
          {aside && <span className={styles.sectionAside}>{aside}</span>}
        </div>
      ) : (
        <button
          type="button"
          className={styles.sectionHead}
          aria-expanded={isOpen}
          onClick={toggle}
        >
          <span>{title}</span>
          <span className={styles.sectionAside}>
            {aside}
            <SvgChevron
              size="16"
              className={cn(styles.sectionChevron, {
                [styles.sectionChevron_open]: isOpen,
              })}
            />
          </span>
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
