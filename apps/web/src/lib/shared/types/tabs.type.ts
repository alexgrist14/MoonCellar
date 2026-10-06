import { CSSProperties, ReactNode } from "react";

export interface ITabContent {
  tabName: string;
  tabNameNode?: ReactNode;
  prefix?: ReactNode;
  addon?: ReactNode;
  count?: number;
  onTabClick?: (...args: any[]) => void;
  tabLink?: string;
  isUnselectable?: boolean;
  isHidden?: boolean;
  isMuted?: boolean;
  ariaLabel?: string;
  tooltip?: ReactNode;
  className?: string;
  style?: CSSProperties;
}
