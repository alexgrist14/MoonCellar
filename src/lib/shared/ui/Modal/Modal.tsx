import { FC, ReactNode, useRef } from "react";
import { IModalParams } from "./Modal.types";
import cn from "classnames";
import styles from "./Modal.module.scss";
import useCloseEvents from "../../hooks/useCloseEvents";
import { SvgClose } from "../svg";

interface IModalProps extends IModalParams {
  children: ReactNode;
}

export const Modal: FC<IModalProps> = ({ children, onClose }) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const closePopup = () => {
    if (onClose) onClose();
  };

  useCloseEvents([modalRef], () => closePopup());

  return (
    <div className={cn(styles.modal)}>
      <div ref={modalRef} className={styles.modal__content}>
        <button className={styles.modal__close} onClick={onClose}>
          <SvgClose />
        </button>
        {children}
      </div>
      <div className={styles.modal__overlay}></div>
    </div>
  );
};
