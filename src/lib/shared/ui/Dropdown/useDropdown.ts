import { useCallback, useEffect, useRef, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import useCloseEvents from "../../hooks/useCloseEvents";
import {
  IDropDownListProps,
  IDropdownClickOptions,
  IDropdownPortalCoords,
  IIndexedItem,
} from "./Dropdown.types";

export const useDropdown = ({
  list,
  initialValue,
  initialMultiValue,
  initialExcludeValue,
  getValue,
  getValues,
  getExcludeValues,
  getIndex,
  getIndexes,
  getExcludeIndexes,
  getSearchQuery,
  onLoad,
  onClose,
  rootRef,
  overwriteValue,
  overflowRootId,
  isMulti,
  isDisabled,
  isWithSearch,
  isWithInput,
  isWithExclude,
  isThroughPortal,
}: IDropDownListProps) => {
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

  const [portalCoords, setPortalCoords] =
    useState<IDropdownPortalCoords | null>(null);

  const innerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const portalRef = useRef<HTMLDivElement>(null);
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
    options: IDropdownClickOptions
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

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);

    if (!!getSearchQuery) {
      getSearchQuery(nextQuery);
    } else {
      debouncedQueryChange(nextQuery);
    }
  };

  const handleValueChange = (nextValue: string) => {
    setValue(nextValue);
  };

  const handleValueBlur = (nextValue: string) => {
    !!getValue && getValue(nextValue);
  };

  const defaultPlaceholder = isWithInput
    ? "Enter/Select value..."
    : "Select...";

  const isWithValue = !!(
    (!isMulti && !!value) ||
    (isMulti && (!!multiValue.length || !!excludeValue.length))
  );

  const shouldShowSearch =
    isWithSearch === undefined ? list.length > 10 : isWithSearch;

  const isFieldDisabled =
    isDisabled || (!list.length && !isWithSearch && !isWithInput);

  const isChevronDisabled = isDisabled || (!list.length && !isWithSearch);

  const isAllChecked = !list.some((_, i) => !multiValue.includes(i));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive]);

  useEffect(() => {
    if (!indexedList.length && !!list.length) {
      setIndexedList(
        sortList(list.map((item, i) => ({ value: item, index: i })))
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getSearchQuery, list]);

  useEffect(() => {
    if (!isThroughPortal || !isActive) return;

    const rect = dropdownRef.current?.getBoundingClientRect();

    !!rect &&
      setPortalCoords({
        top: rect.top,
        left: rect.left,
        width: rect.width,
      });
  }, [isActive, isThroughPortal]);

  useCloseEvents([dropdownRef, portalRef], () => {
    isActive && (offset.current = 0);
    setIsActive(false);
  });

  return {
    isActive,
    value,
    multiValue,
    excludeValue,
    query,
    indexedList,
    offset: offset.current,
    dropdownRef,
    portalRef,
    portalCoords,
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
  };
};
