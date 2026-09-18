"use client";

import { FC } from "react";
import classNames from "classnames";
import styles from "./AppliedFilters.module.scss";
import { SvgClose } from "../svg";

export interface IAppliedFilter {
  key: string;
  label: string;
  onRemove: () => void;
}

interface IAppliedFiltersProps {
  filters: IAppliedFilter[];
  onClearAll: () => void;
  className?: string;
}

export const AppliedFilters: FC<IAppliedFiltersProps> = ({
  filters,
  onClearAll,
  className,
}) => {
  if (!filters.length) return null;

  return (
    <div className={classNames(styles.applied, className)}>
      {filters.map(({ key, label, onRemove }) => (
        <button
          key={key}
          type="button"
          className={styles.applied__pill}
          aria-label={`Remove filter ${label}`}
          onClick={onRemove}
        >
          {label}
          <SvgClose size="12" />
        </button>
      ))}
      <button
        type="button"
        className={styles.applied__clear}
        onClick={onClearAll}
      >
        Clear all
      </button>
    </div>
  );
};
