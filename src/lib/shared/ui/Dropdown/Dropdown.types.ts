import { CSSProperties, RefObject } from "react";

export interface IIndexedItem {
  value: string;
  index: number;
}

export interface IDropDownListProps {
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

export interface IDropdownClickOptions {
  isChecked?: boolean;
  isExcluded?: boolean;
  isReset?: boolean;
  isAll?: boolean;
}

export const DROPDOWN_VIRTUALIZATION_THRESHOLD = 50;
export const DROPDOWN_ITEM_HEIGHT = 51;
export const DROPDOWN_ITEM_HEIGHT_WITH_ICON = 61;
export const DROPDOWN_DEFAULT_MAX_HEIGHT = 300;
