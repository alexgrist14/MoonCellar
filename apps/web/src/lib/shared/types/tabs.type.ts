import { CSSProperties, ReactNode } from "react";

export interface ITabContent {
  tabName: string;
  tabNameNode?: ReactNode;
  prefix?: ReactNode;
  count?: number;
  onTabClick?: (...args: any[]) => void;
  tabLink?: string;
  isUnselectable?: boolean;
  isHidden?: boolean;
  ariaLabel?: string;
  tooltip?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
