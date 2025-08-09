import { CSSProperties, ReactNode } from "react";

export interface ITableCell {
  id?: string;
  content: string | ReactNode;
  sortingValue?: string | number | null;
  style?: CSSProperties;
  className?: string;
  onClick?: () => void;
  link?: string;
  title?: string | ReactNode;
  isHidden?: boolean;
}

type GenericCell<T> = Record<keyof T, ITableCell>;

export type ITableHeaders<T> = GenericCell<T>;
export type ITableRows<T> = GenericCell<T>[];
