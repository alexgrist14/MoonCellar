import { ReactNode } from "react";

export interface IModalParams {
  onClose?: () => void;
  id?: string;
  // deps?: unknown[];
}

export interface IModal {
  open: (component: ReactNode, props?: IModalParams) => void;
  close: (id?: string) => void;
}

export interface IModalPropsState {
  component: ReactNode;
  props: IModalParams;
  id: string;
}
