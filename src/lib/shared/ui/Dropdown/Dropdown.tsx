import { memo } from "react";
import cl from "classnames";
import styles from "./Dropdown.module.scss";
import { IDropDownListProps } from "./Dropdown.types";
import { useDropdown } from "./useDropdown";
import { DropdownControls } from "./components/DropdownControls";
import { DropdownField } from "./components/DropdownField";
import { DropdownList } from "./components/DropdownList";

export const Dropdown = memo((props: IDropDownListProps) => {
  const {
    className,
    placeholder,
    style,
    fieldStyle,
    wrapperStyle,
    title,
    maxHeight,
    isMulti,
    isCompact,
    isDisabled,
    isWithReset,
    isWithInput,
    isWithAll,
    isWithExclude,
    borderTheme,
    icons,
  } = props;

  const {
    isActive,
    value,
    multiValue,
    excludeValue,
    query,
    indexedList,
    offset,
    dropdownRef,
    innerRef,
    searchRef,
    defaultPlaceholder,
    isWithValue,
    shouldShowSearch,
    isFieldDisabled,
    isChevronDisabled,
    isAllChecked,
    clickHandler,
    fieldClickHandler,
    handleQueryChange,
    handleValueChange,
    handleValueBlur,
  } = useDropdown(props);

  return (
    <div className={styles.wrapper} style={wrapperStyle}>
      {title && <h4>{title}</h4>}
      <div
        className={cl(className, styles.dropdown, {
          [styles.dropdown_active]: isActive,
          [styles.dropdown_compact]: isCompact,
        })}
        style={style}
        ref={dropdownRef}
      >
        <DropdownControls
          isWithReset={isWithReset}
          isDisabled={isDisabled}
          isWithValue={isWithValue}
          onReset={() =>
            clickHandler({ index: -1, value: "" }, { isReset: true })
          }
          isWithAll={isWithAll}
          isMulti={isMulti}
          isAllChecked={isAllChecked}
          onToggleAll={() =>
            clickHandler(undefined, {
              isAll: !isAllChecked,
              isReset: isAllChecked,
            })
          }
          isActive={isActive}
          isChevronDisabled={isChevronDisabled}
          onToggle={fieldClickHandler}
        />
        <DropdownField
          fieldStyle={fieldStyle}
          isWithReset={isWithReset}
          isWithAll={isWithAll}
          isActive={isActive}
          isWithValue={isWithValue}
          hasOffset={!!offset}
          isCompact={isCompact}
          borderTheme={borderTheme}
          isFieldDisabled={isFieldDisabled}
          isWithInput={isWithInput}
          value={value}
          placeholder={placeholder}
          defaultPlaceholder={defaultPlaceholder}
          onClick={fieldClickHandler}
          onChange={handleValueChange}
          onBlur={handleValueBlur}
        />
        <DropdownList
          innerRef={innerRef}
          offset={offset}
          isActive={isActive}
          borderTheme={borderTheme}
          shouldShowSearch={shouldShowSearch}
          query={query}
          searchRef={searchRef}
          onQueryChange={handleQueryChange}
          maxHeight={maxHeight}
          indexedList={indexedList}
          multiValue={multiValue}
          excludeValue={excludeValue}
          value={value}
          isMulti={isMulti}
          isWithExclude={isWithExclude}
          icons={icons}
          onItemClick={clickHandler}
        />
      </div>
    </div>
  );
});

Dropdown.displayName = "Dropdown";
