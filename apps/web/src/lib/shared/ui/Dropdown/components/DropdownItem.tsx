import { CSSProperties, memo, ReactNode } from "react";
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
  iconNode?: ReactNode;
  hint?: string;
  isIconSlot?: boolean;
  isCheckSlot?: boolean;
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
    iconNode,
    hint,
    isIconSlot,
    isCheckSlot,
    onClick,
    style,
  }: IDropdownItemProps) => {
    return (
      <div
        className={styles.dropdown__item}
        onClick={onClick}
        style={{
          gridTemplateColumns: `${!!icon ? "40px " : isIconSlot ? "auto " : ""}1fr ${hint ? "auto " : ""}auto`,
          ...style,
        }}
      >
        {!!icon && (
          <div className={styles.dropdown__image}>
            <Image alt="" src={icon} width={200} height={90} priority />
          </div>
        )}
        {!icon && isIconSlot && (
          <span className={styles.dropdown__icon}>{iconNode}</span>
        )}
        <span>{item.value}</span>
        {!!hint && <span className={styles.dropdown__hint}>{hint}</span>}
        {(isMulti || isChecked || isCheckSlot) && (
          <div
            className={styles.dropdown__check}
            style={isMulti || isChecked ? undefined : { visibility: "hidden" }}
            aria-hidden={isMulti || isChecked ? undefined : true}
          >
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
