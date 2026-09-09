import { FC } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import styles from "./fields.module.scss";

interface INumberFieldProps {
  label: string;
  value?: number;
  onChange: (value: number | undefined) => void;
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
        onChange(e.target.value === "" ? undefined : Number(e.target.value))
      }
      error={error ? { type: "manual", message: error } : undefined}
    />
  </div>
);
