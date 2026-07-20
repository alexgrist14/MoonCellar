import { FC } from "react";
import cl from "classnames";
import styles from "../Dropdown.module.scss";
import { SvgChevron } from "../../svg";
import { Button, ButtonColor } from "../../Button";
import { Checkbox } from "../../Checkbox";

interface IDropdownControlsProps {
  isWithReset?: boolean;
  isDisabled?: boolean;
  isWithValue: boolean;
  onReset: () => void;
  isWithAll?: boolean;
  isMulti?: boolean;
  isAllChecked: boolean;
  onToggleAll: () => void;
  isActive: boolean;
  isChevronDisabled: boolean;
  onToggle: () => void;
}

export const DropdownControls: FC<IDropdownControlsProps> = ({
  isWithReset,
  isDisabled,
  isWithValue,
  onReset,
  isWithAll,
  isMulti,
  isAllChecked,
  onToggleAll,
  isActive,
  isChevronDisabled,
  onToggle,
}) => {
  return (
    <div className={styles.dropdown__controls}>
      {isWithReset && !isDisabled && isWithValue && (
        <Button
          color={ButtonColor.RED}
          style={{ padding: "2px 5px" }}
          className={styles.dropdown__close}
          onClick={onReset}
        >
          Reset
        </Button>
      )}
      {isWithAll && isMulti && (
        <Checkbox
          borderColor="white"
          colorTheme="on"
          onChange={onToggleAll}
          checked={isAllChecked}
        />
      )}
      <div
        className={cl(styles.dropdown__icon, {
          [styles.dropdown__icon_active]: isActive,
          [styles.dropdown__icon_disabled]: isChevronDisabled,
        })}
        onClick={onToggle}
      >
        <SvgChevron />
      </div>
    </div>
  );
};
