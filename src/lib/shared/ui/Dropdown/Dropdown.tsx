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
  const [queryList, setQueryList] =
    useState<{ index: number; value: string }[]>();

  const listRef = useRef<HTMLUListElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const changeRef = useRef(false);

  const debouncedQueryChange = useDebouncedCallback((value: string) => {
    const values = list.reduce(
      (result: { index: number; value: string }[], element, index) => {
        element.toLowerCase().includes(value.toLowerCase()) &&
          result.push({ index: index, value: element });
        return result;
      },
      []
    );

    setQueryList(values);
  }, 300);

  const clickHandler = (index: number, value: string, isChecked?: boolean) => {
    if (!isMulti) {
      setValue(value);
      setIsActive(false);
      isActive && (offset.current = 0);
      !!getValue && getValue(value || null);
      !!getIndex && getIndex(!!queryList ? queryList[index].index : index);
    } else {
      if (isChecked) {
        setMultiValue((v) =>
          v.filter((i) => i !== (!!queryList ? queryList[index].index : index))
        );
      } else
        setMultiValue((v) =>
          [...v, !!queryList ? queryList[index].index : index].sort(
            (a, b) => a - b
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

    !isDisabled && (!!list.length || isWithSearch) && setIsActive(!isActive);
  };

  const defaultPlaceholder = isWithInput
    ? "Enter/Select value..."
    : "Select...";

  useCloseEvents([dropdownRef], () => {
    isActive && (offset.current = 0);
    setIsActive(false);
  });

  useEffect(() => {
    if (!!value && !isWithInput && !overwriteValue) {
      !list.includes(value) && setValue(initialValue);
    }
  }, [initialValue, value, list, isWithInput, overwriteValue]);

  useEffect(() => {
    overwriteValue !== undefined && setValue(overwriteValue);
  }, [overwriteValue]);

  useEffect(() => {
    initialMultiValue && setMultiValue(initialMultiValue);
  }, [initialMultiValue]);

  useEffect(() => {
    if (!isActive && changeRef.current && isMulti) {
      changeRef.current = false;
      getIndexes && getIndexes(multiValue);
      getValues && getValues(multiValue.map((index) => list[index]));
    }
  }, [multiValue, getIndexes, isActive, isMulti, getValues, list]);

  useEffect(() => {
    isActive && (changeRef.current = true);
    setTimeout(
      () =>
        isActive &&
        !isWithInput &&
        !!searchRef.current &&
        searchRef.current.focus(),
      220
    );
  }, [isActive, isWithInput]);

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
          {!isMulti && isWithReset && !isDisabled && !!value && (
            <Button
              color="red"
              style={{ padding: "2px" }}
              className={styles.dropdown__close}
              onClick={() => {
                clickHandler(-1, "");
              }}
            >
              <SvgClose />
            </Button>
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
          style={fieldStyle}
          className={cl(styles.dropdown__field, {
            [styles.dropdown__field_active]: isActive,
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
          {(isWithSearch === undefined ? list.length > 10 : isWithSearch) && (
            <input
              ref={searchRef}
              className={styles.dropdown__search}
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
              {(queryList?.map((element) => element.value) || list).map(
                (item, index) => {
                  const isChecked = multiValue.includes(
                    !!queryList ? queryList[index].index : index
                  );
                  const key = `${item.replace(/[^W+]/g, "_")}-${index}`;

                  return (
                    <div
                      key={key}
                      className={styles.dropdown__item}
                      onClick={() => {
                        clickHandler(index, item, isChecked);
                      }}
                    >
                      <span>{item}</span>
                      {isMulti && (
                        <Checkbox
                          colorTheme={
                            borderTheme === "green"
                              ? "on"
                              : borderTheme === "red"
                              ? "off"
                              : "accent"
                          }
                          onChange={() => clickHandler(index, item, isChecked)}
                          checked={isChecked}
                        />
                      )}
                    </div>
                  );
                }
              )}
            </ul>
          </Scrollbar>
        </div>
      </div>
    </div>
  );
};
