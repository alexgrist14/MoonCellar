import { CSSProperties, InputHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.scss";
import classNames from "classnames";

interface InputProps
  extends Pick<
    InputHTMLAttributes<HTMLInputElement>,
    | "placeholder"
    | "required"
    | "type"
    | "value"
    | "className"
    | "style"
    | "onChange"
    | "disabled"
    | "defaultValue"
    | "autoFocus"
    | "autoComplete"
    | "onKeyDown"
    | "onBlur"
    | "onMouseOver"
    | "onMouseOut"
    | "id"
    | "name"
  > {
  containerStyles?: CSSProperties;
  containerClassname?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ containerStyles, className, containerClassname, ...props }, ref) => {
    return (
      <div
        className={classNames(styles.container, containerClassname)}
        style={containerStyles}
      >
        <input
          ref={ref}
          className={classNames(styles.input, className)}
          {...props}
        />
      </div>
    );
  }
);

Input.displayName = "Input";
