import React, { ButtonHTMLAttributes, FC } from "react";
import cl from "classnames";
import styles from "./Button.module.scss";
import { IButtonColor } from "../../types/buttons";

interface IButton
  extends Pick<
    ButtonHTMLAttributes<HTMLButtonElement>,
    | "children"
    | "disabled"
    | "type"
    | "className"
    | "onClick"
    | "form"
    | "style"
  > {
  color?: IButtonColor;
  active?: boolean;
}
export const Button: FC<IButton> = ({
  children,
  className,
  disabled,
  active,
  color = "default",
  ...props
}) => {
  return (
    <button
      {...props}
      className={cl(styles.button, styles[`button_${color}Color`], className, {
        [styles.button_active]: active,
        [styles.button_disabled]: disabled,
      })}
      disabled={disabled}
    >
      {children}
    </button>
  );
};
