import { FC } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import styles from "./fields.module.scss";

interface INumberFieldProps {
  label: string;
  value?: number | null;
  onChange: (value: number | null) => void;
  error?: string;
  disabled?: boolean;
}

export const NumberField: FC<INumberFieldProps> = ({
  label,
  value,
  onChange,
  error,
  disabled,
}) => (
  <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <Input
      type="number"
      value={value ?? ""}
      disabled={disabled}
      onChange={(e) =>
        onChange(e.target.value === "" ? null : Number(e.target.value))
      }
      error={error}
    />
  </div>
);
