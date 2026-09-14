import { FC, KeyboardEvent, MouseEvent, ReactNode, useRef } from "react";
import { IModalParams } from "./Modal.types";
import cn from "classnames";
import styles from "./Modal.module.scss";
import { modal } from "./ModalsConnector";
import { ResizeHandle } from "../ResizeHandle";

interface IModalProps extends IModalParams {
  children: ReactNode;
}

export const Modal: FC<IModalProps> = ({
  children,
  id,
  onClose,
  isResizable,
}) => {
  const contentRef = useRef<HTMLDivElement>(null);

  const closeCallback = (
    e: KeyboardEvent<HTMLDivElement> | MouseEvent<HTMLDivElement>
  ) => {
    e.stopPropagation();
    onClose?.();
    modal.close(id);
  };

  return (
    <div className={cn(styles.modal)} id={id} key={id}>
      <div ref={contentRef} className={styles.modal__content}>
        {children}
        {isResizable && <ResizeHandle targetRef={contentRef} isCentered />}
      </div>
      <div className={styles.modal__overlay} onClick={closeCallback}></div>
    </div>
  );
};
