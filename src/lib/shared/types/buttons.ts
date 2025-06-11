import { HTMLAttributeAnchorTarget, ReactNode } from "react";
import { IButtonProps } from "../ui/Button";

export interface IButtonGroupItem extends IButtonProps {
  title: string | ReactNode;
  link?: string;
  target?: HTMLAttributeAnchorTarget;
}
