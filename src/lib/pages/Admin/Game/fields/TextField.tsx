import { FC } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import styles from "./fields.module.scss";

interface ITextFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
  readOnly?: boolean;
}

export const TextField: FC<ITextFieldProps> = ({
  label,
  value,
  onChange,
  error,
  disabled,
  readOnly,
}) => (
  <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <Input
      value={value ?? ""}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(e) => onChange(e.target.value)}
      error={error ? { type: "manual", message: error } : undefined}
    />
  </div>
);
