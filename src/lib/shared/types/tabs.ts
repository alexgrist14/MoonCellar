import { CSSProperties, ReactNode } from "react";

export interface ITabContent {
  tabName: string;
  tabNameNode?: ReactNode;
  onTabClick?: (...args: any[]) => void;
  tabLink?: string;
  tabBody?: ReactNode;
  isUnselectable?: boolean;
  className?: string;
  style?: CSSProperties;
}
