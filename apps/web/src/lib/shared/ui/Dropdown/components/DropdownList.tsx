import { FC, RefObject, useState } from "react";
import cl from "classnames";
import styles from "../Dropdown.module.scss";
import { Scrollbar } from "../../Scrollbar";
import { DropdownItem } from "./DropdownItem";
import { DropdownSearch } from "./DropdownSearch";
import { DropdownVirtualList } from "./DropdownVirtualList";
import {
  DROPDOWN_DEFAULT_MAX_HEIGHT,
  DROPDOWN_ITEM_HEIGHT,
  DROPDOWN_ITEM_HEIGHT_WITH_ICON,
  DROPDOWN_VIRTUALIZATION_THRESHOLD,
  IDropdownClickOptions,
  IIndexedItem,
} from "../Dropdown.types";

interface IDropdownListProps {
  innerRef: RefObject<HTMLDivElement | null>;
  offset: number;
  isActive: boolean;
  borderTheme?: "default" | "green" | "red";
  shouldShowSearch: boolean;
  query: string;
  searchRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (value: string) => void;
  maxHeight?: string;
  indexedList: IIndexedItem[];
  multiValue: number[];
  excludeValue: number[];
  value?: string;
  isMulti?: boolean;
  isWithExclude?: boolean;
  icons?: string[];
  onItemClick: (item: IIndexedItem, options: IDropdownClickOptions) => void;
}

export const DropdownList: FC<IDropdownListProps> = ({
  innerRef,
  offset,
  isActive,
  borderTheme,
  shouldShowSearch,
  query,
  searchRef,
  onQueryChange,
  maxHeight,
  indexedList,
  multiValue,
  excludeValue,
  value,
  isMulti,
  isWithExclude,
  icons,
  onItemClick,
}) => {
  const [scrollTop, setScrollTop] = useState(0);

  const buildItemProps = (item: IIndexedItem) => {
    const isChecked =
      multiValue.includes(item.index) || (!isMulti && value === item.value);
    const isExcluded = excludeValue.includes(item.index);
    const icon = !!icons?.length ? icons[item.index] : "";

    return {
      item,
      isChecked,
      isExcluded,
      isMulti,
      isWithExclude,
      icon,
      onClick: () => onItemClick(item, { isChecked, isExcluded }),
    };
  };

  const isVirtualized = indexedList.length > DROPDOWN_VIRTUALIZATION_THRESHOLD;
  const rowHeight = !!icons?.length
    ? DROPDOWN_ITEM_HEIGHT_WITH_ICON
    : DROPDOWN_ITEM_HEIGHT;
  const viewportHeight =
    parseInt(maxHeight || "", 10) || DROPDOWN_DEFAULT_MAX_HEIGHT;

  return (
    <div
      className={cl(styles.dropdown__inner, {
        [styles.dropdown__inner_active]: isActive,
        [styles.dropdown__inner_overflow]: !!offset,
        [styles[`dropdown__inner_${borderTheme}`]]: !!borderTheme,
      })}
      style={{ transform: `translateY(${offset}px)` }}
    >
      {!offset && <div className={styles.dropdown__placeholder}></div>}
      {shouldShowSearch && (
        <DropdownSearch
          isActive={isActive}
          query={query}
          searchRef={searchRef}
          onChange={onQueryChange}
        />
      )}
      <Scrollbar
        initialContentRef={innerRef}
        fadeType="both"
        type="absolute"
        classNameContent={styles.scrollbars__content}
        classNameThumb={styles.scrollbars__thumb}
        classNameScrollbar={styles.scrollbars__scrollbar}
        contentStyle={{ maxHeight: maxHeight || "300px" }}
        onScroll={({ scrollTop }) => setScrollTop(scrollTop || 0)}
      >
        <div
          className={cl(styles.dropdown__list, {
            [styles.dropdown__list_active]: isActive,
          })}
        >
          {isVirtualized ? (
            <DropdownVirtualList
              indexedList={indexedList}
              rowHeight={rowHeight}
              height={viewportHeight}
              scrollTop={scrollTop}
              getItemProps={buildItemProps}
            />
          ) : (
            indexedList.map((item, index) => (
              <DropdownItem
                key={`${item.value?.replace(/[^W+]/g, "_")}-${index}`}
                {...buildItemProps(item)}
              />
            ))
          )}
        </div>
      </Scrollbar>
    </div>
  );
};
