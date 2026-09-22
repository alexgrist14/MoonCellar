import { FC, useMemo } from "react";
import { Dropdown } from "@/src/lib/shared/ui/Dropdown";
import styles from "./fields.module.scss";

interface IEnumListFieldProps {
  label: string;
  value?: string[];
  options: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
}

export const EnumListField: FC<IEnumListFieldProps> = ({
  label,
  value,
  options,
  onChange,
  disabled,
}) => {
  const list = useMemo(
    () => Array.from(new Set([...(options || []), ...(value || [])])),
    [options, value]
  );

  const initialMultiValue = useMemo(
    () =>
      (value || [])
        .map((item) => list.indexOf(item))
        .filter((index) => index >= 0),
    [value, list]
  );

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <Dropdown
        list={list}
        placeholder={`Select ${label.toLowerCase()}`}
        overwriteValue={
          value?.length ? `Selected ${value.length}` : undefined
        }
        isMulti
        isWithSearch
        isWithReset
        isThroughPortal
        isDisabled={disabled}
        initialMultiValue={initialMultiValue}
        getValues={onChange}
      />
    </div>
  );
};
