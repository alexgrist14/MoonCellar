import { ReactNode } from "react";

export type IButtonColor =
  | "default"
  | "accent"
  | "red"
  | "green"
  | "greenBorder"
  | "transparent"
  | "fancy";

export interface IButtonGroupItem {
  title: string | ReactNode;
  callback?: () => void;
  link?: string;
  color?: IButtonColor;
  isActive?: boolean;
  isDisabled?: boolean;
  isHidden?: boolean;
}
