import { CSSProperties, memo } from "react";
import Image from "next/image";
import styles from "../Dropdown.module.scss";
import { Checkbox } from "../../Checkbox";
import { IIndexedItem } from "../Dropdown.types";

export interface IDropdownItemProps {
  item: IIndexedItem;
  isChecked: boolean;
  isExcluded: boolean;
  isMulti?: boolean;
  isWithExclude?: boolean;
  icon?: string;
  onClick: () => void;
  style?: CSSProperties;
}

export const DropdownItem = memo(
  ({
    item,
    isChecked,
    isExcluded,
    isMulti,
    isWithExclude,
    icon,
    onClick,
    style,
  }: IDropdownItemProps) => {
    return (
      <div
        className={styles.dropdown__item}
        onClick={onClick}
        style={{
          gridTemplateColumns: `${!!icon ? "40px " : ""}1fr auto`,
          ...style,
        }}
      >
        {!!icon && (
          <div className={styles.dropdown__image}>
            <Image alt="Icon" src={icon} width={200} height={90} priority />
          </div>
        )}
        <span>{item.value}</span>
        {(isMulti || isChecked) && (
          <div className={styles.dropdown__check}>
            <Checkbox
              colorTheme={
                isWithExclude ? (isExcluded ? "off" : "on") : "accent"
              }
              checked={isChecked || isExcluded || false}
              onChange={() => {}}
            />
          </div>
        )}
      </div>
    );
  }
);

DropdownItem.displayName = "DropdownItem";
