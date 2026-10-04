import { FC, ReactNode } from "react";
import styles from "./fields.module.scss";

interface IFieldProps {
  label: string;
  error?: string;
  children: ReactNode;
}

export const Field: FC<IFieldProps> = ({ label, error, children }) => (
  <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    {children}
    {!!error && <span className={styles.fieldError}>{error}</span>}
  </div>
);
