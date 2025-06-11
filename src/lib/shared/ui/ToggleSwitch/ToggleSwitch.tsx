import { FC, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./ToggleSwitch.module.scss";
import classNames from "classnames";

interface ToggleSwitchProps {
  className?: string;
  leftContent?: string;
  rightContent?: string;
  clickCallback: (result: string) => void;
  scale?: string;
  defaultValue?: "left" | "right";
  value?: "left" | "right";
  isDisabled?: boolean;
  label?: string;
}

export const ToggleSwitch: FC<ToggleSwitchProps> = ({
  className = "",
  leftContent = "OFF",
  rightContent = "ON",
  clickCallback,
  scale = "0.8",
  defaultValue,
  value,
  isDisabled,
  label,
}) => {
  const [isActive, setIsActive] = useState(false);
  const [toggleValue, setToggleValue] = useState<string>(
    defaultValue || "left"
  );

  const debouncedCallback = useDebouncedCallback(clickCallback, 200);

  const clickHandler = (): void => {
    if (!value) {
      setToggleValue(toggleValue === "left" ? "right" : "left");
      debouncedCallback(toggleValue === "right" ? leftContent : rightContent);
    } else {
      debouncedCallback(value === "right" ? leftContent : rightContent);
    }
    setIsActive(true);
    setTimeout(() => setIsActive(false), 600);
  };

  return (
    <div className={styles.toggle__wrapper}>
      {!!label && <p className={styles.toggle__label}>{label}</p>}
      <div
        onClick={clickHandler}
        className={classNames(
          styles.toggle,
          className,
          styles[`toggle_${value || toggleValue}`],
          {
            [styles.toggle_active]: isActive || isDisabled,
          }
        )}
        style={{ scale }}
      >
        <div
          className={classNames(
            styles.toggle__button,
            styles[`toggle__button_${value || toggleValue}`]
          )}
        />
        <span className={styles.toggle__left}>{leftContent}</span>
        <span className={styles.toggle__right}>{rightContent}</span>
      </div>
    </div>
  );
};
