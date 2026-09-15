import classNames from "classnames";
import styles from "../GameCommunity.module.scss";

interface ISortToggleProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

export const SortToggle = <T extends string>({
  label,
  value,
  options,
  onChange,
}: ISortToggleProps<T>) => (
  <div className={styles.segmented} role="group" aria-label={label}>
    {options.map((option) => (
      <button
        key={option.value}
        type="button"
        aria-pressed={option.value === value}
        className={classNames(styles.segmented__button, {
          [styles.segmented__button_active]: option.value === value,
        })}
        onClick={() => onChange(option.value)}
      >
        {option.label}
      </button>
    ))}
  </div>
);
