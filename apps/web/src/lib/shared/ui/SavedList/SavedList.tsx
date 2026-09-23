import { FC } from "react";
import { Button, ButtonColor } from "../Button";
import styles from "./SavedList.module.scss";

interface ISavedListItem {
  name: string;
  onApply: () => void;
  onRemove: () => void;
}

export const SavedList: FC<{ items: ISavedListItem[] }> = ({ items }) => (
  <ul className={styles.saved}>
    {items.map(({ name, onApply, onRemove }) => (
      <li key={name} className={styles.saved__row}>
        <button type="button" className={styles.saved__apply} onClick={onApply}>
          <span className={styles.saved__name}>{name}</span>
        </button>
        <Button
          color={ButtonColor.RED}
          className={styles.saved__remove}
          onClick={onRemove}
        >
          Remove
        </Button>
      </li>
    ))}
  </ul>
);
