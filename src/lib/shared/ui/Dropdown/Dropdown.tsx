import {
  CSSProperties,
  FC,
  RefObject,
  useEffect,
  useRef,
  useState,
} from "react";
import cl from "classnames";
import styles from "./Dropdown.module.scss";
import { useDebouncedCallback } from "use-debounce";
import { SvgChevron, SvgClose } from "../svg";
import { useRouter } from "next/router";
import { Button } from "../Button";
import useCloseEvents from "../../hooks/useCloseEvents";
import { Scrollbar } from "../Scrollbar";
import { Checkbox } from "../Checkbox";

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
  style?: CSSProperties;
  fieldStyle?: CSSProperties;
  wrapperStyle?: CSSProperties;
  getValue?: (value: string | null) => void;
  getValues?: (values: string[]) => void;
  getIndex?: (index: number) => void;
  getIndexes?: (indexes: number[]) => void;
  title?: string;
  rootRef?: RefObject<HTMLDivElement>;
  getSearchQuery?: (value: string) => void;
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
  borderTheme?: "default" | "green" | "red";
}

export const Dropdown: FC<IDropDownListProps> = ({
  className,
  list,
  placeholder,
  initialValue,
  initialMultiValue,
  style,
  fieldStyle,
  wrapperStyle,
  getValue,
  getValues,
  getIndex,
  getIndexes,
  title,
  rootRef,
  getSearchQuery,
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
  borderTheme,
}) => {
  const router = useRouter();
  const [isActive, setIsActive] = useState(false);
  const [value, setValue] = useState(initialValue);
  const [multiValue, setMultiValue] = useState<number[]>(
    initialMultiValue || []
  );

  const offset = useRef<number>(0);

  const [query, setQuery] = useState("");
  const [indexedList, setIndexedList] = useState<IIndexedItem[]>([]);
  const [sortedList, setSortedList] = useState<IIndexedItem[]>([]);

  const listRef = useRef<HTMLUListElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const debouncedQueryChange = useDebouncedCallback((value: string) => {
    const values = sortedList.reduce(
      (result: { index: number; value: string }[], element) => {
        element.value.toLowerCase().includes(value.toLowerCase()) &&
          result.push(element);
        return result;
      },
      []
    );

    setSortedList(values);
  }, 300);

  const clickHandler = (
    item: IIndexedItem | undefined,
    options: { isChecked?: boolean; isReset?: boolean; isAll?: boolean }
  ) => {
    const { index, value } = item || { index: -1, value: "" };
    const { isChecked, isReset, isAll } = options;

    if (!isMulti) {
      setValue(value);
      setIsActive(false);

      isActive && (offset.current = 0);

      !!getValue && getValue(value || null);
      !!getIndex && getIndex(index);
    } else {
      let values: number[] = [];

      if (isReset) {
        values = [];
      } else if (isAll) {
        values = sortedList.map((item) => item.index);
      } else {
        values = isChecked
          ? multiValue.filter((i) => i !== index)
          : [...multiValue, index].sort((a, b) => a - b);
      }

      setMultiValue(values);

      !!getIndexes && getIndexes(values);
      !!getValues &&
        getValues(
          sortedList.reduce(
            (res: string[], item) =>
              values.some((value) => value === item.index)
                ? [...res, item.value]
                : res,
            []
          )
        );
    }
  };

  const fieldClickHandler = () => {
    const rootRect =
      rootRef?.current?.getBoundingClientRect() ||
      (!!router.isReady &&
        !!overflowRootId &&
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

  useCloseEvents([dropdownRef], () => {
    isActive && (offset.current = 0);
    setIsActive(false);
  });

  useEffect(() => {
    setIndexedList(list.map((item, i) => ({ value: item, index: i })));
  }, [list]);

  useEffect(() => {
    if (!!value && !isWithInput && !overwriteValue) {
      !list.includes(value) && setValue(initialValue);
    }
  }, [initialValue, value, list, isWithInput, overwriteValue]);

  useEffect(() => {
    overwriteValue !== undefined && setValue(overwriteValue);
  }, [overwriteValue]);

  useEffect(() => {
    initialMultiValue && !multiValue && setMultiValue(initialMultiValue);
  }, [initialMultiValue, multiValue]);

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
    isActive
      ? setSortedList((list) => (!!list?.length ? list : indexedList))
      : setSortedList(() => {
          const first: IIndexedItem[] = [];
          const second: IIndexedItem[] = [];

          indexedList.forEach((item) => {
            multiValue.includes(item.index)
              ? first.push(item)
              : second.push(item);
          });

          return [...first, ...second];
        });
  }, [indexedList, multiValue, isActive]);

  useEffect(() => {
    !isActive && setQuery("");
  }, [isActive]);

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
          {isWithReset && !isDisabled && !!value && (
            <Button
              color="red"
              style={{ padding: "2px" }}
              className={styles.dropdown__close}
              onClick={() => {
                clickHandler({ index: -1, value: "" }, { isReset: true });
              }}
            >
              <SvgClose />
            </Button>
          )}
          {isWithAll && isMulti && (
            <Checkbox
              borderColor="white"
              colorTheme="on"
              onChange={() =>
                clickHandler(undefined, {
                  isAll: indexedList.some(
                    (item) => !multiValue.includes(item.index)
                  ),
                  isReset: !indexedList.some(
                    (item) => !multiValue.includes(item.index)
                  ),
                })
              }
              checked={
                !indexedList.some((item) => !multiValue.includes(item.index))
              }
            />
          )}
          <div
            className={cl(styles.dropdown__icon, {
              [styles.dropdown__icon_active]: isActive,
              [styles.dropdown__icon_disabled]:
                isDisabled || (!indexedList.length && !isWithSearch),
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
            [styles.dropdown__field_overflow]: !!offset.current,
            [styles.dropdown__field_compact]: isCompact,
            [styles[`dropdown__field_${borderTheme}`]]: !!borderTheme,
            [styles.dropdown__field_disabled]:
              isDisabled ||
              (!indexedList.length && !isWithSearch && !isWithInput),
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
          <div className={styles.dropdown__placeholder}></div>
          {(isWithSearch === undefined
            ? indexedList.length > 10
            : isWithSearch) && (
            <div className={styles.dropdown__search}>
              <input
                ref={searchRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);

                  if (!!getSearchQuery) {
                    return getSearchQuery(e.target.value);
                  }

                  debouncedQueryChange(e.target.value);
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
              {sortedList.map((item, index) => {
                const isChecked = multiValue.includes(item.index);
                const key = `${item.value.replace(/[^W+]/g, "_")}-${index}`;

                return (
                  <div
                    key={key}
                    className={styles.dropdown__item}
                    onClick={() => {
                      clickHandler(item, { isChecked });
                    }}
                  >
                    <span>{item.value}</span>
                    {isMulti && (
                      <Checkbox
                        colorTheme={
                          borderTheme === "green"
                            ? "on"
                            : borderTheme === "red"
                            ? "off"
                            : "accent"
                        }
                        onChange={() => clickHandler(item, { isChecked })}
                        checked={isChecked}
                      />
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
