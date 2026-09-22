import { HTMLAttributeAnchorTarget, ReactNode } from "react";
import { IButtonProps } from "@/src/lib/shared/ui/Button";

export interface IButtonGroupItem extends IButtonProps {
  title: string | ReactNode;
  link?: string;
  target?: HTMLAttributeAnchorTarget;
}
