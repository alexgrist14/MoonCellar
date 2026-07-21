import { SortType } from "@/src/lib/shared/types/sort.type";
import classNames from "classnames";
import { FC, ReactNode } from "react";
import { Radio } from "../Radio";
import styles from "./CustomDropdown.module.scss";

interface CustomDropdownProps {
  options: { label: SortType }[];
  extendedOptions?: { label: string }[];
  selected: SortType;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
  onSelect: (value: SortType) => void;
  onExtendedSelect?: (value: string) => void;
  extendedSelected?: string;
  className?: string;
  headerClassName?: string;
  icon?: ReactNode;
}
export const CustomDropdown: FC<CustomDropdownProps> = ({
  options,
  selected,
  extendedOptions,
  onExtendedSelect,
  isOpen,
  setIsOpen,
  extendedSelected,
  onSelect,
  className,
  headerClassName,
  icon,
}) => {
  const handleSelect = (value: SortType) => {
    onSelect(value);
    setIsOpen(false);
  };

  const handleExtendedSelect = (value: string) => {
    if (onExtendedSelect) {
      onExtendedSelect(value);
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.dropdown}>
      <div
        className={classNames(styles.dropdown__header, headerClassName)}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className={styles.dropdown__label}>
          {icon}
          <span>{selected}</span>
        </div>
        <span
          className={classNames(styles.dropdown__icon, {
            [styles.dropdown__icon_open]: isOpen,
          })}
        ></span>
      </div>
      <div
        className={classNames(styles.dropdown__body, className, {
          [styles.dropdown__body_open]: isOpen,
        })}
      >
        {options.map((option) => (
          <label key={option.label} className={styles.dropdown__item}>
            {option.label}
            <Radio
              name="sort-option"
              checked={selected === option.label}
              onChange={() => handleSelect(option.label)}
            />
          </label>
        ))}

        {extendedOptions && (
          <div className={styles.dropdown__bottom}>
            {extendedOptions.map((option) => (
              <label key={option.label} className={styles.dropdown__item}>
                {option.label}
                <Radio
                  checked={option.label === extendedSelected}
                  name="extended-sort-option"
                  onChange={() => handleExtendedSelect(option.label)}
                />
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
