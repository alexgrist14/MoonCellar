import { FC, useId, useMemo, useRef } from "react";
import { Input } from "@/src/lib/shared/ui/Input";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { dateInputToUnix, unixToDateInput } from "./DateField";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import styles from "./fields.module.scss";

export interface IObjectFieldDescriptor {
  key: string;
  label: string;
  kind: "text" | "number" | "boolean" | "date";
  defaultValue?: unknown;
  optionsKey?: string;
  options?: string[];
  derive?: (value: unknown) => Record<string, unknown>;
}

interface IObjectListFieldProps {
  label: string;
  value?: Record<string, unknown>[];
  onChange: (value: Record<string, unknown>[]) => void;
  fields: IObjectFieldDescriptor[];
  disabled?: boolean;
  isLabelHidden?: boolean;
}

let rowIdCounter = 0;
const createRowId = () => `object-row-${rowIdCounter++}`;

export const ObjectListField: FC<IObjectListFieldProps> = ({
  label,
  value,
  onChange,
  fields,
  disabled,
  isLabelHidden,
}) => {
  const items = value ?? [];
  const datalistPrefix = useId();

  const rowIdsRef = useRef<string[]>([]);

  if (rowIdsRef.current.length !== items.length) {
    rowIdsRef.current = items.map(() => createRowId());
  }

  const keys = rowIdsRef.current;

  const patch = (
    index: number,
    field: IObjectFieldDescriptor,
    next: unknown
  ) =>
    onChange(
      items.map((item, i) =>
        i === index
          ? { ...item, [field.key]: next, ...(field.derive?.(next) ?? {}) }
          : item
      )
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

  const datalists = useMemo(
    () =>
      fields
        .filter((field) => field.options?.length)
        .map((field) => (
          <datalist key={field.key} id={`${datalistPrefix}-${field.key}`}>
            {field.options!.map((option, optionIndex) => (
              <option key={`${optionIndex}-${option}`} value={option} />
            ))}
          </datalist>
        )),
    [fields, datalistPrefix]
  );

  return (
    <div className={styles.field}>
      {!isLabelHidden && <span className={styles.label}>{label}</span>}
      {datalists}
      {items.map((item, index) => (
        <div key={keys[index]} className={styles.objectRow}>
          {fields.map((field) => (
            <div key={field.key} className={styles.field}>
              <span className={styles.label}>{field.label}</span>
              {field.kind === "boolean" ? (
                <Checkbox
                  checked={Boolean(item[field.key])}
                  disabled={disabled}
                  onChange={(e) => patch(index, field, e.target.checked)}
                />
              ) : field.kind === "date" ? (
                <Input
                  type="date"
                  value={unixToDateInput(
                    item[field.key] as number | undefined
                  )}
                  disabled={disabled}
                  onChange={(e) =>
                    patch(index, field, dateInputToUnix(e.target.value))
                  }
                />
              ) : (
                <Input
                  type={field.kind === "number" ? "number" : "text"}
                  list={
                    field.options?.length
                      ? `${datalistPrefix}-${field.key}`
                      : undefined
                  }
                  value={
                    (item[field.key] as string | number | undefined) ?? ""
                  }
                  disabled={disabled}
                  onChange={(e) =>
                    patch(
                      index,
                      field,
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
