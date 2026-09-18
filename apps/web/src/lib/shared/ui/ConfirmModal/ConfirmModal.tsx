import { FC, ReactNode, useState } from "react";
import styles from "./ConfirmModal.module.scss";
import { Button, ButtonColor } from "../Button/Button";

interface IConfirmModalProps {
  title: string;
  message: ReactNode;
  warning?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<unknown>;
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
  const [isConfirming, setIsConfirming] = useState(false);

  const handleConfirm = async () => {
    if (isConfirming) return;

    setIsConfirming(true);

    try {
      await onConfirm();
    } catch {
      setIsConfirming(false);
    }
  };

  return (
    <div className={styles.container}>
      <h3>{title}</h3>
      <p>{message}</p>
      {warning && <p className={styles.warning}>{warning}</p>}
      <div className={styles.buttons}>
        <Button
          color={ButtonColor.DEFAULT}
          disabled={isConfirming}
          onClick={onCancel}
        >
          {cancelText}
        </Button>
        <Button
          color={ButtonColor.RED}
          disabled={isConfirming}
          onClick={handleConfirm}
        >
          {confirmText}
        </Button>
      </div>
    </div>
  );
};
