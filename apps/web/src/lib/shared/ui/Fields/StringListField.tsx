import { FC, ReactNode, useEffect, useState } from "react";
import classNames from "classnames";
import { Input } from "@/src/lib/shared/ui/Input";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { SvgCheck } from "@/src/lib/shared/ui/svg";
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
  const [addedIndex, setAddedIndex] = useState<number>();
  const items = value ?? [];

  useEffect(() => {
    if (addedIndex === undefined) return;

    const timeout = setTimeout(() => setAddedIndex(undefined), 900);

    return () => clearTimeout(timeout);
  }, [addedIndex]);

  const add = () => {
    if (!pending.trim()) return;
    onChange([...items, pending.trim()]);
    setAddedIndex(items.length);
    setPending("");
  };

  const isJustAdded = addedIndex !== undefined;

  return (
    <div className={styles.field}>
      <span className={styles.label}>{label}</span>
      <div className={styles.chips}>
        {items.map((item, index) => (
          <Chip
            key={`${item}-${index}`}
            variant="outlined"
            className={classNames(styles.chip, {
              [styles.chip_added]: index === addedIndex,
            })}
            removeLabel={`Remove ${item}`}
            isDisabled={disabled}
            onRemove={() => onChange(items.filter((_, i) => i !== index))}
          >
            {item}
          </Chip>
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
                autoComplete="off"
                onChange={(e) => setPending(e.target.value)}
                onKeyDown={(e) => {
                  if (e.nativeEvent.isComposing) return;
                  if (e.key !== "Enter" && e.code !== "NumpadEnter") return;
                  e.preventDefault();
                  add();
                }}
              />
              <Button
                type="button"
                color={isJustAdded ? ButtonColor.GREEN : ButtonColor.DEFAULT}
                className={styles.addButton}
                disabled={disabled}
                onClick={add}
              >
                {isJustAdded ? (
                  <>
                    <SvgCheck size="12" style={{ color: "inherit" }} />
                    Added
                  </>
                ) : (
                  "Add"
                )}
              </Button>
            </>
          )}
          {action}
        </div>
      )}
    </div>
  );
};
