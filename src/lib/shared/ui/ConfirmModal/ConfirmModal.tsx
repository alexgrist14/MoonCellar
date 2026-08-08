import { FC, ReactNode } from "react";
import styles from "./ConfirmModal.module.scss";
import { Button, ButtonColor } from "../Button/Button";

interface IConfirmModalProps {
  title: string;
  message: ReactNode;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: FC<IConfirmModalProps> = ({
  title,
  message,
  warning,
  confirmText = "Delete",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}) => {
  return (
    <div className={styles.container}>
      <h3>{title}</h3>
      <p>{message}</p>
      {warning && <p className={styles.warning}>{warning}</p>}
      <div className={styles.buttons}>
        <Button color={ButtonColor.DEFAULT} onClick={onCancel}>
          {cancelText}
        </Button>
        <Button color={ButtonColor.RED} onClick={onConfirm}>
          {confirmText}
        </Button>
      </div>
    </div>
  );
};
