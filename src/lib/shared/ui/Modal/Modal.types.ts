import { ReactNode } from 'react';

export interface IModalParams {
  onClose?: () => void;
}

export interface IModal {
  open: (component: ReactNode, id?: string, props?: IModalParams) => void;
  /**
   * @param id Закрывает попап с id, иначе все сразу.
   */
  close: (id?: string) => void;
}

export interface IModalPropsState {
  component: ReactNode;
  props: IModalParams;
  id: string;
}
