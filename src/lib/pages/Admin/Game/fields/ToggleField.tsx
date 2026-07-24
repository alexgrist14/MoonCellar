import { FC } from "react";
import { ToggleSwitch } from "@/src/lib/shared/ui/ToggleSwitch";
import styles from "./fields.module.scss";

interface IToggleFieldProps {
  label: string;
  value?: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
}

const ON = "ON";
const OFF = "OFF";

export const ToggleField: FC<IToggleFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
}) => (
  <div className={styles.field}>
    <span className={styles.label}>{label}</span>
    <ToggleSwitch
      leftContent={OFF}
      rightContent={ON}
      value={value ? "right" : "left"}
      isDisabled={disabled}
      clickCallback={(result) => onChange(result === ON)}
    />
  </div>
);
