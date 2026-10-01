import { FC, KeyboardEvent, ReactNode, useId, useState } from "react";
import { useDebouncedCallback } from "use-debounce";
import styles from "./ToggleSwitch.module.scss";
import classNames from "classnames";

type ToggleSide = "left" | "right";

interface ToggleSwitchProps {
  className?: string;
  leftContent?: ReactNode;
  rightContent?: ReactNode;
  clickCallback?: (result: ReactNode) => void;
  onChange?: (value: boolean) => void;
  checked?: boolean;
  scale?: string;
  defaultValue?: ToggleSide;
  value?: ToggleSide;
  isDisabled?: boolean;
  isColorless?: boolean;
  label?: string;
  hint?: ReactNode;
  labelPosition?: "start" | "end";
}

export const ToggleSwitch: FC<ToggleSwitchProps> = ({
  className = "",
  leftContent = "OFF",
  rightContent = "ON",
  clickCallback,
  onChange,
  checked,
  scale = "0.8",
  defaultValue,
  value,
  isDisabled,
  isColorless,
  label,
  hint,
  labelPosition = "start",
}) => {
  const [isActive, setIsActive] = useState(false);
  const [toggleValue, setToggleValue] = useState<ToggleSide>(
    defaultValue || "left"
  );

  const labelId = useId();
  const hintId = useId();
  const isControlled = checked !== undefined || !!value;
  const position: ToggleSide =
    checked !== undefined ? (checked ? "right" : "left") : value || toggleValue;

  const notify = useDebouncedCallback((next: ToggleSide) => {
    clickCallback?.(next === "right" ? rightContent : leftContent);
    onChange?.(next === "right");
  }, 200);

  const clickHandler = (): void => {
    if (isActive || isDisabled) return;

    const next = position === "left" ? "right" : "left";

    if (!isControlled) setToggleValue(next);
    notify(next);
    setIsActive(true);
    setTimeout(() => setIsActive(false), 600);
  };

  const keyDownHandler = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key !== " " && event.key !== "Enter") return;

    event.preventDefault();
    clickHandler();
  };

  const text = (!!label || !!hint) && (
    <div className={styles.toggle__text}>
      {!!label && (
        <p id={labelId} className={styles.toggle__label}>
          {label}
        </p>
      )}
      {!!hint && (
        <p id={hintId} className={styles.toggle__hint}>
          {hint}
        </p>
      )}
    </div>
  );

  return (
    <div
      className={classNames(styles.toggle__wrapper, {
        [styles.toggle__wrapper_withHint]: !!hint,
      })}
    >
      {labelPosition === "start" && text}
      <div
        role="switch"
        aria-checked={position === "right"}
        aria-disabled={isDisabled || undefined}
        aria-labelledby={label ? labelId : undefined}
        aria-describedby={hint ? hintId : undefined}
        tabIndex={isDisabled ? -1 : 0}
        onClick={clickHandler}
        onKeyDown={keyDownHandler}
        className={classNames(
          styles.toggle,
          className,
          styles[`toggle_${position}`],
          {
            [styles.toggle_active]: isActive || isDisabled,
            [styles.toggle_colorless]: isColorless,
          }
        )}
        style={{ scale }}
      >
        <div
          className={classNames(
            styles.toggle__button,
            styles[`toggle__button_${position}`]
          )}
        />
        <span className={styles.toggle__left}>{leftContent}</span>
        <span className={styles.toggle__right}>{rightContent}</span>
      </div>
      {labelPosition === "end" && text}
    </div>
  );
};
