import { FC } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import styles from "./fields.module.scss";

export const unixToDateInput = (value?: number | null): string => {
  if (value === undefined || value === null || Number.isNaN(value)) return "";
  return new Date(value * 1000).toISOString().slice(0, 10);
};

export const dateInputToUnix = (value: string): number | undefined => {
  if (!value) return undefined;
  const parsed = Date.parse(`${value}T00:00:00Z`);
  if (Number.isNaN(parsed)) return undefined;
  return Math.floor(parsed / 1000);
};

export const deriveReleaseDateFields = (
  value: unknown
): Record<string, unknown> => {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return { human: undefined, month: undefined, year: undefined };
  }

  const date = new Date(value * 1000);

  return {
    human: date.toLocaleDateString("en-US", {
      timeZone: "UTC",
      month: "short",
      day: "2-digit",
      year: "numeric",
    }),
    month: date.getUTCMonth() + 1,
    year: date.getUTCFullYear(),
  };
};

interface IDateFieldProps {
  label: string;
  value?: number | null;
  onChange: (value: number | undefined) => void;
  error?: string;
  disabled?: boolean;
  isLabelHidden?: boolean;
}

export const DateField: FC<IDateFieldProps> = ({
  label,
  value,
  onChange,
  error,
  disabled,
  isLabelHidden,
}) => (
  <div className={styles.field}>
    {!isLabelHidden && <span className={styles.label}>{label}</span>}
    <Input
      type="date"
      value={unixToDateInput(value)}
      disabled={disabled}
      onChange={(e) => onChange(dateInputToUnix(e.target.value))}
      error={error ? { type: "manual", message: error } : undefined}
    />
  </div>
);
