import classNames from "classnames";
import { Button } from "../Button";
import { Dropdown } from "../Dropdown";
import { FilterGroup } from "../FilterGroup";
import { SvgChevron } from "../svg";
import styles from "./SortControl.module.scss";

export type ISortOrder = "asc" | "desc";

export interface ISortControlOption<T extends string> {
  value: T;
  label: string;
}

interface ISortControlProps<T extends string> {
  options: ISortControlOption<T>[];
  sortBy?: T;
  sortOrder: ISortOrder;
  onChange: (sortBy: T | undefined, sortOrder: ISortOrder) => void;
  label?: string;
  placeholder?: string;
  isDisabled?: boolean;
  isWithReset?: boolean;
  isThroughPortal?: boolean;
  overflowRootId?: string;
  className?: string;
}

export const SortControl = <T extends string>({
  options,
  sortBy,
  sortOrder,
  onChange,
  label,
  placeholder,
  isDisabled,
  isWithReset,
  isThroughPortal = true,
  overflowRootId,
  className,
}: ISortControlProps<T>) => {
  const orderLabel = sortOrder === "asc" ? "Ascending" : "Descending";

  const control = (
    <div className={classNames(styles.sort, !label && className)}>
      <Dropdown
        isThroughPortal={isThroughPortal}
        isWithReset={isWithReset}
        overflowRootId={overflowRootId}
        isDisabled={isDisabled}
        placeholder={placeholder}
        list={options.map((option) => option.label)}
        overwriteValue={
          options.find((option) => option.value === sortBy)?.label ?? ""
        }
        getIndex={(index) =>
          onChange(index >= 0 ? options[index]?.value : undefined, sortOrder)
        }
      />
      <Button
        type="button"
        isOnlyIcon
        tooltip={orderLabel}
        disabled={isDisabled || !sortBy}
        onClick={() => onChange(sortBy, sortOrder === "asc" ? "desc" : "asc")}
      >
        <SvgChevron
          className={classNames(styles.sort__chevron, {
            [styles.sort__chevron_asc]: sortOrder === "asc",
          })}
        />
      </Button>
    </div>
  );

  if (!label) return control;

  return (
    <FilterGroup title={label} className={className}>
      {control}
    </FilterGroup>
  );
};
