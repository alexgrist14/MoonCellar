import { FC } from "react";
import classNames from "classnames";
import { Checkbox } from "@/src/lib/shared/ui/Checkbox";
import { SvgLock } from "@/src/lib/shared/ui/svg";
import styles from "./ListCheckRow.module.scss";

interface IListCheckRowProps {
  name: string;
  count: number;
  isChecked: boolean;
  onToggle: () => void;
  isPrivate?: boolean;
  isPending?: boolean;
  isTouch?: boolean;
  isDisabled?: boolean;
  disabledHint?: string;
}

export const ListCheckRow: FC<IListCheckRowProps> = ({
  name,
  count,
  isChecked,
  onToggle,
  isPrivate,
  isPending,
  isTouch,
  isDisabled,
  disabledHint,
}) => (
  <label
    className={classNames(styles.row, {
      [styles.row_pending]: isPending,
      [styles.row_touch]: isTouch,
      [styles.row_disabled]: isDisabled,
    })}
    title={isDisabled ? disabledHint : undefined}
  >
    <Checkbox
      checked={isChecked}
      disabled={isPending || isDisabled}
      onChange={onToggle}
    />
    <span className={styles.row__name}>{name}</span>
    {isPrivate && (
      <SvgLock
        size="12"
        className={styles.row__lock}
        style={{ color: "inherit" }}
        aria-label="Private list"
      />
    )}
    <span className={styles.row__count}>{count}</span>
  </label>
);
