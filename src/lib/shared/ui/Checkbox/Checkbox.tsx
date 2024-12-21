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
  isBorderFromTheme?: boolean;
}

export const Checkbox: FC<ICheckboxProps> = ({
  className,
  colorTheme = "accent",
  borderColor,
  isBorderFromTheme,
  ...props
}) => {
  return (
    <input
      style={{ borderColor }}
      className={classNames(styles.checkbox, className, {
        [styles[`checkbox__border_${colorTheme}`]]: isBorderFromTheme,
        [styles[`checkbox_${colorTheme}`]]: props.checked,
      })}
      type="checkbox"
      {...props}
    />
  );
};
