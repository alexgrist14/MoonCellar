import { FC, ReactNode, useState } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./fields.module.scss";

interface IStringListFieldProps {
  label: string;
  value?: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  action?: ReactNode;
  isAddDisabled?: boolean;
}

export const StringListField: FC<IStringListFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
  action,
  isAddDisabled,
}) => {
  const [pending, setPending] = useState("");
  const items = value ?? [];

  const add = () => {
    if (!pending.trim()) return;
    onChange([...items, pending.trim()]);
    setPending("");
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.chips}>
        {items.map((item, index) => (
          <span key={`${item}-${index}`} className={styles.chip}>
            {item}
            <Button
              type="button"
              compact
              color={ButtonColor.TRANSPARENT}
              disabled={disabled}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              x
            </Button>
          </span>
        ))}
      </div>
      {(!isAddDisabled || !!action) && (
        <div className={styles.row}>
          {!isAddDisabled && (
            <>
              <Input
                value={pending}
                disabled={disabled}
                placeholder={`Add ${label.toLowerCase()}`}
                onChange={(e) => setPending(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  e.preventDefault();
                  add();
                }}
              />
              <Button
                type="button"
                color={ButtonColor.DEFAULT}
                disabled={disabled}
                onClick={add}
              >
                Add
              </Button>
            </>
          )}
          {action}
        </div>
      )}
    </div>
  );
};
