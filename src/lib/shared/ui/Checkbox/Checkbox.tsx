import { FC, InputHTMLAttributes } from "react";
import styles from "./Checkbox.module.scss";
import classNames from "classnames";

interface ICheckboxProps
  extends Pick<
    InputHTMLAttributes<HTMLInputElement>,
    "required" | "disabled" | "onChange" | "id" | "checked" | "className"
  > {
  colorTheme?: "accent" | "on" | "off";
  borderColor?: string;
}

export const Checkbox: FC<ICheckboxProps> = ({
  className,
  colorTheme = "accent",
  borderColor,
  ...props
}) => {
  return (
    <input
      style={{ borderColor }}
      className={classNames(styles.checkbox, className, {
        [styles[`checkbox_${colorTheme}`]]: props.checked,
      })}
      type="checkbox"
      {...props}
    />
  );
};
