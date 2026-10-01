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
}

export const ListCheckRow: FC<IListCheckRowProps> = ({
  name,
  count,
  isChecked,
  onToggle,
  isPrivate,
  isPending,
  isTouch,
}) => (
  <label
    className={classNames(styles.row, {
      [styles.row_pending]: isPending,
      [styles.row_touch]: isTouch,
    })}
  >
    <Checkbox checked={isChecked} disabled={isPending} onChange={onToggle} />
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
