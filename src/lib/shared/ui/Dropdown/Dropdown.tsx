import {
  CSSProperties,
  FC,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import cl from "classnames";
import styles from "./Dropdown.module.scss";
import { useDebouncedCallback } from "use-debounce";
import { SvgChevron } from "../svg";
import { Button } from "../Button";
import useCloseEvents from "../../hooks/useCloseEvents";
import { Scrollbar } from "../Scrollbar";
import { Checkbox } from "../Checkbox";
import classNames from "classnames";
import Image from "next/image";

interface IIndexedItem {
  value: string;
  index: number;
}

interface IDropDownListProps {
  className?: string;
  list: string[];
  placeholder?: string;
  initialValue?: string;
  initialMultiValue?: number[];
  initialExcludeValue?: number[];
  style?: CSSProperties;
  fieldStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
  getValue?: (value: string | null) => void;
  getValues?: (values: string[]) => void;
  getExcludeValues?: (values: string[]) => void;
  getIndex?: (index: number) => void;
  getIndexes?: (indexes: number[]) => void;
  getExcludeIndexes?: (indexes: number[]) => void;
  getSearchQuery?: (value: string) => void;
  onClose?: () => void;
  onLoad?: () => void;
  title?: string;
  rootRef?: RefObject<HTMLDivElement>;
  overwriteValue?: string;
  overflowRootId?: string;
  maxHeight?: string;
  isMulti?: boolean;
  isCompact?: boolean;
  isDisabled?: boolean;
  isWithReset?: boolean;
  isWithSearch?: boolean;
  isWithInput?: boolean;
  isWithAll?: boolean;
  isWithExclude?: boolean;
  borderTheme?: "default" | "green" | "red";
  icons?: string[];
}

export const Dropdown: FC<IDropDownListProps> = ({
  className,
  list,
  placeholder,
  initialValue,
  initialMultiValue,
  initialExcludeValue,
  style,
  fieldStyle,
  wrapperStyle,
  getValue,
  getValues,
  getExcludeValues,
  getIndex,
  getIndexes,
  getExcludeIndexes,
  getSearchQuery,
  onLoad,
  onClose,
  title,
  rootRef,
  overwriteValue,
  overflowRootId,
  maxHeight,
  isMulti,
  isCompact,
  isDisabled,
  isWithReset,
  isWithSearch,
  isWithInput,
  isWithAll,
  isWithExclude,
  borderTheme,
  icons,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [multiValue, setMultiValue] = useState<number[]>(
    initialMultiValue || []
  );
  const [excludeValue, setExcludeValue] = useState<number[]>(
    initialExcludeValue || []
  );

  const offset = useRef<number>(0);

  const [query, setQuery] = useState("");

  const [indexedList, setIndexedList] = useState<IIndexedItem[]>([]);

  const listRef = useRef<HTMLUListElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const firstActive = useRef(true);

  const sortList = useCallback(
    (list: IIndexedItem[]) => {
      if (!!getSearchQuery) {
        return list;
      } else {
        const first: IIndexedItem[] = [];
        const second: IIndexedItem[] = [];
        const third: IIndexedItem[] = [];

        list.forEach((item) => {
          multiValue.includes(item.index)
            ? first.push(item)
            : isWithExclude && excludeValue.includes(item.index)
              ? second.push(item)
              : third.push(item);
        });

        return [...first, ...second, ...third];
      }
    },
    [getSearchQuery, excludeValue, multiValue, isWithExclude]
  );

  const debouncedQueryChange = useDebouncedCallback((value: string) => {
    const values = list.reduce(
      (result: { index: number; value: string }[], element, index) => {
        element.toLowerCase().includes(value.toLowerCase()) &&
          result.push({ index, value: element });
        return result;
      },
      []
    );

    setIndexedList(sortList(values));
  }, 300);

  const clickHandler = (
    item: IIndexedItem | undefined,
    options: {
      isChecked?: boolean;
      isExcluded?: boolean;
      isReset?: boolean;
      isAll?: boolean;
    }
  ) => {
    const { index, value } = item || { index: -1, value: "" };
    const { isChecked, isReset, isAll, isExcluded } = options;

    if (!isMulti) {
      setValue(value);
      setIsActive(false);

      isActive && (offset.current = 0);

      !!getValue && getValue(value || null);
      !!getIndex && getIndex(index);
    } else {
      let values: number[] = multiValue;
      let excludedValues: number[] = excludeValue;

      if (isReset) {
        values = [];
        isWithExclude && (excludedValues = []);
      } else if (isAll) {
        values = indexedList.map((item) => item.index);
      } else {
        if (isWithExclude) {
          if (!isChecked && !isExcluded) {
            values = [...multiValue, index].sort((a, b) => a - b);
          } else if (isChecked) {
            values = multiValue.filter((i) => i !== index);
            excludedValues = [...excludeValue, index].sort((a, b) => a - b);
          } else if (isExcluded) {
            excludedValues = excludeValue.filter((i) => i !== index);
          }
        } else {
          !isChecked
            ? (values = [...multiValue, index].sort((a, b) => a - b))
            : (values = multiValue.filter((i) => i !== index));
        }
      }

      setMultiValue(values);
      isWithExclude && setExcludeValue(excludedValues);

      !!getIndexes && getIndexes(values);
      !!getValues &&
        getValues(
          indexedList.reduce(
            (res: string[], item) =>
              values.some((value) => value === item.index)
                ? [...res, item.value]
                : res,
            []
          )
        );

      if (isWithExclude) {
        !!getExcludeIndexes && getExcludeIndexes(excludedValues);
        !!getExcludeValues &&
          getExcludeValues(
            indexedList.reduce(
              (res: string[], item) =>
                excludedValues.some((value) => value === item.index)
                  ? [...res, item.value]
                  : res,
              []
            )
          );
      }
    }
  };

  const fieldClickHandler = () => {
    const rootRect =
      rootRef?.current?.getBoundingClientRect() ||
      (!!overflowRootId &&
        document.getElementById(overflowRootId)?.getBoundingClientRect());
    const listRect = innerRef.current?.getBoundingClientRect();

    offset.current =
      !!rootRect &&
      !!listRect &&
      Math.floor(rootRect.bottom) - 25 < Math.floor(listRect.bottom)
        ? rootRect.bottom - 25 - listRect.bottom
        : 0;

    !isDisabled &&
      (!!indexedList.length || isWithSearch) &&
      setIsActive(!isActive);
  };

  const defaultPlaceholder = isWithInput
    ? "Enter/Select value..."
    : "Select...";

  const isWithValue =
    (!isMulti && !!value) ||
    (isMulti && (!!multiValue.length || !!excludeValue.length));

  useEffect(() => {}, [list]);

  useEffect(() => {
    if (!!value && !isWithInput && !overwriteValue) {
      !list.includes(value) && setValue(initialValue);
    }
  }, [initialValue, value, list, isWithInput, overwriteValue]);

  useEffect(() => {
    overwriteValue !== undefined && setValue(overwriteValue);
  }, [overwriteValue]);

  useEffect(() => {
    !!initialMultiValue && setMultiValue(initialMultiValue);
  }, [initialMultiValue]);

  useEffect(() => {
    !!initialExcludeValue && setExcludeValue(initialExcludeValue);
  }, [initialExcludeValue]);

  useEffect(() => {
    isActive &&
      setTimeout(
        () =>
          isActive &&
          !isWithInput &&
          !!searchRef.current &&
          searchRef.current.focus(),
        220
      );
  }, [isActive, isWithInput]);

  useEffect(() => {
    if (isActive && firstActive.current === true) {
      onLoad?.();
      firstActive.current = false;
    }
  }, [isActive, onLoad]);

  useEffect(() => {
    if (!isActive) {
      setQuery("");
      onClose?.();
    } else {
      setIndexedList(
        sortList(list.map((item, i) => ({ value: item, index: i })))
      );
    }
  }, [isActive]);

  useEffect(() => {
    if ((!indexedList.length && !!list.length) || !!getSearchQuery) {
      setIndexedList(
        sortList(list.map((item, i) => ({ value: item, index: i })))
      );
    }
  }, [getSearchQuery, list]);

  useCloseEvents([dropdownRef], () => {
    isActive && (offset.current = 0);
    setIsActive(false);
  });

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
        <div className={styles.dropdown__controls}>
          {isWithReset && !isDisabled && isWithValue && (
            <Button
              color="red"
              style={{ padding: "2px 5px" }}
              className={styles.dropdown__close}
              onClick={() => {
                clickHandler({ index: -1, value: "" }, { isReset: true });
              }}
            >
              Reset
            </Button>
          )}
          {isWithAll && isMulti && (
            <Checkbox
              borderColor="white"
              colorTheme="on"
              onChange={() =>
                clickHandler(undefined, {
                  isAll: list.some((_, i) => !multiValue.includes(i)),
                  isReset: !list.some((_, i) => !multiValue.includes(i)),
                })
              }
              checked={!list.some((_, i) => !multiValue.includes(i))}
            />
          )}
          <div
            className={cl(styles.dropdown__icon, {
              [styles.dropdown__icon_active]: isActive,
              [styles.dropdown__icon_disabled]:
                isDisabled || (!list.length && !isWithSearch),
            })}
            onClick={fieldClickHandler}
          >
            <SvgChevron />
          </div>
        </div>
        <div
          style={{
            ...fieldStyle,
            paddingRight:
              15 + 10 * ((isWithReset ? 1 : 0) + (isWithAll ? 1 : 0)),
          }}
          className={cl(styles.dropdown__field, {
            [styles.dropdown__field_active]: isActive,
            [styles.dropdown__field_exists]: isWithValue,
            [styles.dropdown__field_overflow]: !!offset.current,
            [styles.dropdown__field_compact]: isCompact,
            [styles[`dropdown__field_${borderTheme}`]]: !!borderTheme,
            [styles.dropdown__field_disabled]:
              isDisabled || (!list.length && !isWithSearch && !isWithInput),
          })}
          onClick={fieldClickHandler}
        >
          {!isWithInput ? (
            <p
              className={styles.dropdown__value}
              style={{
                width:
                  isWithReset && !!value
                    ? "calc(100% - 50px)"
                    : "calc(100% - 20px)",
              }}
            >
              {value || placeholder || defaultPlaceholder}
            </p>
          ) : (
            <input
              className={styles.dropdown__value}
              style={{
                width: isWithReset ? "calc(100% - 50px)" : "calc(100% - 20px)",
              }}
              value={value || ""}
              placeholder={placeholder || defaultPlaceholder}
              onChange={(e) => setValue(e.target.value)}
              onBlur={(e) => !!getValue && getValue(e.target.value)}
            />
          )}
        </div>
        <div
          className={cl(styles.dropdown__inner, {
            [styles.dropdown__inner_active]: isActive,
            [styles.dropdown__inner_overflow]: !!offset.current,
            [styles[`dropdown__inner_${borderTheme}`]]: !!borderTheme,
          })}
          style={{
            transform: `translateY(${offset.current}px)`,
          }}
        >
          {!offset && <div className={styles.dropdown__placeholder}></div>}
          {(isWithSearch === undefined ? list.length > 10 : isWithSearch) && (
            <div
              className={classNames(styles.dropdown__search, {
                [styles.dropdown__search_active]: isActive,
              })}
            >
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);

                  if (!!getSearchQuery) {
                    return getSearchQuery(e.target.value);
                  } else {
                    debouncedQueryChange(e.target.value);
                  }
                }}
                placeholder="Search..."
              />
            </div>
          )}
          <Scrollbar
            contentDefRef={innerRef}
            fadeType="both"
            type="absolute"
            stl={styles}
            contentStyle={{ maxHeight: maxHeight || "300px" }}
          >
            <ul
              ref={listRef}
              className={cl(styles.dropdown__list, {
                [styles.dropdown__list_active]: isActive,
              })}
            >
              {indexedList.map((item, index) => {
                const isChecked = multiValue.includes(item.index);
                const isExcluded = excludeValue.includes(item.index);

                const key = `${item.value.replace(/[^W+]/g, "_")}-${index}`;
                const icon = !!icons?.length ? icons[item.index] : "";

                return (
                  <div
                    key={key}
                    className={styles.dropdown__item}
                    onClick={() => {
                      clickHandler(item, { isChecked, isExcluded });
                    }}
                    style={{
                      gridTemplateColumns: `${!!icon ? "40px " : ""}1fr auto`,
                    }}
                  >
                    {!!icon && (
                      <div className={styles.dropdown__image}>
                        <Image
                          alt="Icon"
                          src={icon}
                          width={200}
                          height={90}
                          priority
                        />
                      </div>
                    )}
                    <span>{item.value}</span>
                    {isMulti && (
                      <div className={styles.dropdown__check}>
                        <Checkbox
                          colorTheme={
                            isWithExclude
                              ? isExcluded
                                ? "off"
                                : "on"
                              : "accent"
                          }
                          checked={isChecked || isExcluded || false}
                          onChange={() => {}}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </ul>
          </Scrollbar>
        </div>
      </div>
    </div>
  );
};
