import { CSSProperties, FC } from "react";
import cl from "classnames";
import styles from "../Dropdown.module.scss";

interface IDropdownFieldProps {
  fieldStyle?: CSSProperties;
  isWithReset?: boolean;
  isWithAll?: boolean;
  isActive: boolean;
  isWithValue: boolean;
  hasOffset: boolean;
  isCompact?: boolean;
  borderTheme?: "default" | "green" | "red";
  isFieldDisabled: boolean;
  isWithInput?: boolean;
  value?: string;
  placeholder?: string;
  defaultPlaceholder: string;
  onClick: () => void;
  onChange: (value: string) => void;
  onBlur: (value: string) => void;
}

export const DropdownField: FC<IDropdownFieldProps> = ({
  fieldStyle,
  isWithReset,
  isWithAll,
  isActive,
  isWithValue,
  hasOffset,
  isCompact,
  borderTheme,
  isFieldDisabled,
  isWithInput,
  value,
  placeholder,
  defaultPlaceholder,
  onClick,
  onChange,
  onBlur,
}) => {
  return (
    <div
      style={{
        ...fieldStyle,
        paddingRight: 15 + 10 * ((isWithReset ? 1 : 0) + (isWithAll ? 1 : 0)),
      }}
      className={cl(styles.dropdown__field, {
        [styles.dropdown__field_active]: isActive,
        [styles.dropdown__field_exists]: isWithValue,
        [styles.dropdown__field_overflow]: hasOffset,
        [styles.dropdown__field_compact]: isCompact,
        [styles[`dropdown__field_${borderTheme}`]]: !!borderTheme,
        [styles.dropdown__field_disabled]: isFieldDisabled,
      })}
      onClick={onClick}
    >
      {!isWithInput ? (
        <p
          className={styles.dropdown__value}
          style={{
            width:
              isWithReset && !!value
                ? "calc(100% - 100px)"
                : "calc(100% - 20px)",
          }}
        >
          {value || placeholder || defaultPlaceholder}
        </p>
      ) : (
        <input
          className={styles.dropdown__value}
          style={{
            width: isWithReset ? "calc(100% - 50px)" : "calc(100% - 20px)",
          }}
          value={value || ""}
          placeholder={placeholder || defaultPlaceholder}
          onChange={(e) => onChange(e.target.value)}
          onBlur={(e) => onBlur(e.target.value)}
        />
      )}
    </div>
  );
};
