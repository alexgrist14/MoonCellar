import { FC, ReactNode, useRef } from "react";
import { IModalParams } from "./Modal.types";
import cn from "classnames";
import styles from "./Modal.module.scss";
import useCloseEvents from "../../hooks/useCloseEvents";

interface IModalProps extends IModalParams {
  children: ReactNode;
}

export const Modal: FC<IModalProps> = ({ children, onClose, id }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closePopup = () => {
    if (onClose) onClose();
  };

  // useCloseEvents([modalRef], () => closePopup());

  return (
    <div className={cn(styles.modal)} id={id} key={id}>
      <div ref={modalRef} className={styles.modal__content}>
        {children}
      </div>
      <div
        className={styles.modal__overlay}
        onClick={(e) => {
          e.stopPropagation();
          closePopup();
        }}
      ></div>
    </div>
  );
};
