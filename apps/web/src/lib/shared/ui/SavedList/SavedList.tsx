import { FC } from "react";
import { Button, ButtonColor } from "../Button";
import { Skeleton } from "../Skeleton";
import styles from "./SavedList.module.scss";

interface ISavedListItem {
  name: string;
  onApply: () => void;
  onRemove: () => void;
}

interface ISavedListProps {
  items?: ISavedListItem[];
  isLoading?: boolean;
}

export const SavedList: FC<ISavedListProps> = ({ items = [], isLoading }) =>
  isLoading ? (
    <div role="status" aria-label="Loading">
      <Skeleton
        count={3}
        height="calc(var(--community-avatar-size) + 2 * var(--padding-x2))"
        radius="var(--radius-x3)"
        gap="var(--gap-x1)"
      />
    </div>
  ) : (
    <ul className={styles.saved}>
      {items.map(({ name, onApply, onRemove }) => (
        <li key={name} className={styles.saved__row}>
          <button
            type="button"
            className={styles.saved__apply}
            onClick={onApply}
          >
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
