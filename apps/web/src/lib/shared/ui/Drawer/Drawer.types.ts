import { ReactNode } from "react";

export interface IDrawerParams {
  title?: string;
  onClose?: () => void;
}

export interface IDrawer {
  open: (component: ReactNode, params?: IDrawerParams) => void;
  close: () => void;
}

export interface IDrawerState {
  component: ReactNode;
  params: IDrawerParams;
}
