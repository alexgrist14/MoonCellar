import { FC, useRef } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./fields.module.scss";

export interface IObjectFieldDescriptor {
  key: string;
  label: string;
  kind: "text" | "number" | "boolean";
  defaultValue?: unknown;
}

interface IObjectListFieldProps {
  label: string;
  value?: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  fields: IObjectFieldDescriptor[];
  disabled?: boolean;
}

let rowIdCounter = 0;
const createRowId = () => `object-row-${rowIdCounter++}`;

export const ObjectListField: FC<IObjectListFieldProps> = ({
  label,
  value,
  onChange,
  fields,
  disabled,
}) => {
  const items = value ?? [];

  const rowIdsRef = useRef<string[]>([]);

  if (rowIdsRef.current.length !== items.length) {
    rowIdsRef.current = items.map(() => createRowId());
  }

  const keys = rowIdsRef.current;

  const patch = (index: number, key: string, next: unknown) =>
    onChange(
      items.map((item, i) => (i === index ? { ...item, [key]: next } : item))
    );

  const addRow = () => {
    onChange([
      ...items,
      Object.fromEntries(
        fields.map((field) => [
          field.key,
          field.defaultValue !== undefined
            ? field.defaultValue
            : field.kind === "boolean"
              ? false
              : undefined,
        ])
      ),
    ]);
    rowIdsRef.current = [...keys, createRowId()];
  };

  const removeRow = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
    rowIdsRef.current = keys.filter((_, i) => i !== index);
  };

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      {items.map((item, index) => (
        <div key={keys[index]} className={styles.objectRow}>
          {fields.map((field) => (
            <div key={field.key} className={styles.field}>
              <span className={styles.label}>{field.label}</span>
              {field.kind === "boolean" ? (
                <Checkbox
                  checked={Boolean(item[field.key])}
                  disabled={disabled}
                  onChange={(e) => patch(index, field.key, e.target.checked)}
                />
              ) : (
                <Input
                  type={field.kind === "number" ? "number" : "text"}
                  value={(item[field.key] as string | number | undefined) ?? ""}
                  disabled={disabled}
                  onChange={(e) =>
                    patch(
                      index,
                      field.key,
                      field.kind === "number"
                        ? e.target.value === ""
                          ? undefined
                          : Number(e.target.value)
                        : e.target.value
                    )
                  }
                />
              )}
            </div>
          ))}
          <Button
            type="button"
            color={ButtonColor.RED}
            disabled={disabled}
            onClick={() => removeRow(index)}
          >
            Remove
          </Button>
        </div>
      ))}
      <Button
        type="button"
        color={ButtonColor.DEFAULT}
        disabled={disabled}
        onClick={addRow}
      >
        Add {label.toLowerCase()}
      </Button>
    </div>
  );
};
