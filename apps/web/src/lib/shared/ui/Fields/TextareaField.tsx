import { FC } from "react";
import { Textarea } from "@/src/lib/shared/ui/Textarea";
import styles from "./fields.module.scss";

interface ITextareaFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export const TextareaField: FC<ITextareaFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
}) => (
  <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <Textarea
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);
