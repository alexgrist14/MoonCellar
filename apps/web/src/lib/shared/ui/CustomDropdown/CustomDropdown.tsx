import { SortType } from "@/src/lib/shared/types/sort.type";
import classNames from "classnames";
import { FC, ReactNode, useRef, useState } from "react";
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
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const [openUpward, setOpenUpward] = useState(false);

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

  const handleToggle = () => {
    if (!isOpen && headerRef.current && bodyRef.current) {
      const { bottom: headerBottom } =
        headerRef.current.getBoundingClientRect();
      const bodyStyle = getComputedStyle(bodyRef.current);
      const gap = Math.max(
        parseFloat(bodyStyle.marginTop) || 0,
        parseFloat(bodyStyle.marginBottom) || 0
      );
      const dropHeight = bodyRef.current.scrollHeight;

      setOpenUpward(headerBottom + gap + dropHeight > window.innerHeight);
    }

    setIsOpen(!isOpen);
  };

  return (
    <div className={styles.dropdown}>
      <div
        ref={headerRef}
        className={classNames(styles.dropdown__header, headerClassName)}
        onClick={handleToggle}
      >
        <div className={styles.dropdown__label}>
          {icon}
          <span>{selected}</span>
        </div>
      </div>
      <div
        ref={bodyRef}
        className={classNames(styles.dropdown__body, className, {
          [styles.dropdown__body_open]: isOpen,
          [styles.dropdown__body_top]: openUpward,
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
