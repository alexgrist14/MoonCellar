import { FC, KeyboardEvent, MouseEvent, ReactNode } from "react";
import { IModalParams } from "./Modal.types";
import cn from "classnames";
import styles from "./Modal.module.scss";
import { modal } from "./ModalsConnector";

interface IModalProps extends IModalParams {
  children: ReactNode;
}

export const Modal: FC<IModalProps> = ({ children, id, onClose }) => {
  const closeCallback = (
    e: KeyboardEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    onClose?.();
    modal.close(id);
  };

  return (
    <div className={cn(styles.modal)} id={id} key={id}>
      <div className={styles.modal__content}>{children}</div>
      <div className={styles.modal__overlay} onClick={closeCallback}></div>
    </div>
  );
};
