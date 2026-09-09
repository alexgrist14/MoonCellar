import { FC, useState } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./fields.module.scss";

interface INumberListFieldProps {
  label: string;
  value?: number[];
  onChange: (value: number[]) => void;
  disabled?: boolean;
}

export const NumberListField: FC<INumberListFieldProps> = ({
  label,
  value,
  onChange,
  disabled,
}) => {
  const [pending, setPending] = useState("");
  const items = value ?? [];

  const add = () => {
    if (pending === "" || Number.isNaN(Number(pending))) return;
    onChange([...items, Number(pending)]);
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
      <div className={styles.row}>
        <Input
          type="number"
          value={pending}
          disabled={disabled}
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
      </div>
    </div>
  );
};
