import { FC, ReactNode } from "react";
import classNames from "classnames";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import styles from "./RemovableChips.module.scss";

export interface IRemovableChip {
  id: string;
  label: string;
  href?: string;
}

interface IRemovableChipsProps {
  items: IRemovableChip[];
  onRemove: (id: string) => void;
  variant?: "chip" | "pill";
  clearAllLabel?: string;
  onClearAll?: () => void;
  getRemoveLabel?: (item: IRemovableChip) => string;
  isDisabled?: boolean;
  isSingleLine?: boolean;
  summary?: ReactNode;
  className?: string;
}

export const RemovableChips: FC<IRemovableChipsProps> = ({
  items,
  onRemove,
  variant = "chip",
  clearAllLabel = "Clear all",
  onClearAll,
  getRemoveLabel = (item) => `Remove ${item.label}`,
  isDisabled,
  isSingleLine,
  summary,
  className,
}) => {
  if (!items.length) {
    return isSingleLine && summary ? (
      <div className={classNames(styles.line, className)}>
        <div className={styles.line__actions}>{summary}</div>
      </div>
    ) : null;
  }

  const clearButton = onClearAll && (
    <button
      type="button"
      className={styles.chips__clear}
      disabled={isDisabled}
      onClick={onClearAll}
    >
      {clearAllLabel}
    </button>
  );

  const list = (
    <ul
      className={classNames(styles.chips, styles[`chips_${variant}`], {
        [styles.chips_singleLine]: isSingleLine,
        [className ?? ""]: !isSingleLine && !!className,
      })}
    >
      {items.map((item) => (
        <li key={item.id} className={styles.chips__item}>
          {variant === "pill" ? (
            <button
              type="button"
              className={styles.chips__pill}
              aria-label={getRemoveLabel(item)}
              disabled={isDisabled}
              onClick={() => onRemove(item.id)}
            >
              {item.label}
              <SvgClose size="12" />
            </button>
          ) : (
            <Chip
              href={item.href}
              removeLabel={getRemoveLabel(item)}
              isDisabled={isDisabled}
              onRemove={() => onRemove(item.id)}
            >
              {item.label}
            </Chip>
          )}
        </li>
      ))}
      {!isSingleLine && clearButton && (
        <li className={styles.chips__item}>{clearButton}</li>
      )}
    </ul>
  );

  if (!isSingleLine) return list;

  return (
    <div className={classNames(styles.line, className)}>
      <div className={styles.line__scroll}>
        <Scrollbar isHorizontal isFaded contentStyle={{ padding: 0 }}>
          {list}
        </Scrollbar>
      </div>
      {(clearButton || summary) && (
        <div className={styles.line__actions}>
          {clearButton}
          {summary}
        </div>
      )}
    </div>
  );
};
