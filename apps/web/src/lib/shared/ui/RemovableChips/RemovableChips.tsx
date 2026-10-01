import { FC } from "react";
import classNames from "classnames";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { SvgClose } from "@/src/lib/shared/ui/svg";
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
  className,
}) => {
  if (!items.length) return null;

  return (
    <ul
      className={classNames(
        styles.chips,
        styles[`chips_${variant}`],
        className
      )}
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
      {onClearAll && (
        <li className={styles.chips__item}>
          <button
            type="button"
            className={styles.chips__clear}
            disabled={isDisabled}
            onClick={onClearAll}
          >
            {clearAllLabel}
          </button>
        </li>
      )}
    </ul>
  );
};
