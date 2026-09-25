"use client";

import { CSSProperties, ReactNode } from "react";
import classNames from "classnames";
import { useDragSort } from "@/src/lib/shared/hooks";
import { moveItem } from "@/src/lib/shared/utils/common.utils";
import { SvgArrow, SvgClose, SvgGrip } from "../svg";
import styles from "./SortableGrid.module.scss";

interface ISortableGridProps<T> {
  items: T[];
  getKey: (item: T) => string;
  getName: (item: T) => string;
  renderCover: (item: T) => ReactNode;
  onChange: (items: T[]) => void;
  onRemove?: (item: T) => void;
  coverRatio?: string;
  emptySlots?: number;
  isDisabled?: boolean;
  className?: string;
}

const ICON_STYLE = { color: "inherit" };

const ARROW_ICON_STYLE = {
  color: "inherit",
  width: "var(--padding-x5)",
  height: "var(--padding-x5)",
  minWidth: "var(--padding-x5)",
  minHeight: "var(--padding-x5)",
};

export const SortableGrid = <T,>({
  items,
  getKey,
  getName,
  renderCover,
  onChange,
  onRemove,
  coverRatio,
  emptySlots = 0,
  isDisabled,
  className,
}: ISortableGridProps<T>) => {
  const { dragIndex, overIndex, getItemProps } = useDragSort(items, onChange);

  const coverStyle: CSSProperties | undefined = coverRatio
    ? { aspectRatio: coverRatio }
    : undefined;

  return (
    <ol className={classNames(styles.grid, className)}>
      {items.map((item, index) => {
        const name = getName(item);

        return (
          <li
            key={getKey(item)}
            className={classNames(styles.slot, {
              [styles.slot_dragging]: dragIndex === index,
              [styles.slot_over]: overIndex === index,
            })}
            {...(isDisabled ? {} : getItemProps(index))}
          >
            <div className={styles.cover} style={coverStyle}>
              {renderCover(item)}
              <span className={styles.grip} aria-hidden="true">
                <SvgGrip size="12" style={ICON_STYLE} />
              </span>
            </div>
            <div className={styles.bar}>
              <button
                type="button"
                className={classNames(styles.icon, styles.icon_flip)}
                aria-label={`Move ${name} left`}
                disabled={isDisabled || index === 0}
                onClick={() => onChange(moveItem(items, index, index - 1))}
              >
                <SvgArrow style={ARROW_ICON_STYLE} />
              </button>
              <button
                type="button"
                className={classNames(styles.icon, styles.icon_danger)}
                aria-label={`Remove ${name}`}
                disabled={isDisabled}
                onClick={() =>
                  onRemove
                    ? onRemove(item)
                    : onChange(items.filter((_, i) => i !== index))
                }
              >
                <SvgClose size="12" style={ICON_STYLE} />
              </button>
              <button
                type="button"
                className={styles.icon}
                aria-label={`Move ${name} right`}
                disabled={isDisabled || index === items.length - 1}
                onClick={() => onChange(moveItem(items, index, index + 1))}
              >
                <SvgArrow style={ARROW_ICON_STYLE} />
              </button>
            </div>
            <span className={styles.name} title={name}>
              {name}
            </span>
          </li>
        );
      })}
      {Array.from({ length: emptySlots }, (_, i) => (
        <li
          key={`empty-${i}`}
          className={classNames(styles.slot, styles.slot_empty)}
        >
          <div className={styles.cover} style={coverStyle}>
            <span className={styles.empty}>Empty slot</span>
          </div>
        </li>
      ))}
    </ol>
  );
};
