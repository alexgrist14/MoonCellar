import { FC, useMemo } from "react";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import styles from "./fields.module.scss";

interface IEnumFieldProps {
  label: string;
  value?: string;
  options: string[];
  onChange: (value: string | undefined) => void;
  error?: string;
  disabled?: boolean;
}

export const EnumField: FC<IEnumFieldProps> = ({
  label,
  value,
  options,
  onChange,
  error,
  disabled,
}) => {
  const list = useMemo(
    () =>
      value && !options.includes(value) ? [...options, value] : options || [],
    [options, value]
  );

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <Dropdown
        list={list}
        placeholder={`Select ${label.toLowerCase()}`}
        isWithSearch
        isWithReset
        isThroughPortal
        isDisabled={disabled}
        initialValue={value}
        getValue={(next) => onChange(next ?? undefined)}
        borderTheme={error ? "red" : undefined}
      />
      {!!error && <span className={styles.fieldError}>{error}</span>}
    </div>
  );
};
