import { FC, ReactNode } from "react";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import styles from "./fields.module.scss";

interface IToggleFieldProps {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
  hint?: ReactNode;
  labelPosition?: "start" | "end";
}

export const ToggleField: FC<IToggleFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  hint,
  labelPosition,
}) => (
  <div className={styles.field}>
    {!labelPosition && (
      <>
        <span className={styles.label}>{label}</span>
        {!!hint && <span className={styles.hint}>{hint}</span>}
      </>
    )}
    <ToggleSwitch
      checked={!!value}
      isDisabled={disabled}
      onChange={onChange}
      {...(labelPosition && { label, hint, labelPosition })}
    />
  </div>
);
