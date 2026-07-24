import { CSSProperties, InputHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.scss";
import classNames from "classnames";
import type { FieldError } from "react-hook-form";

interface InputProps extends Pick<
  InputHTMLAttributes<HTMLInputElement>,
  | "placeholder"
  | "required"
  | "type"
  | "value"
  | "className"
  | "style"
  | "onChange"
  | "disabled"
  | "readOnly"
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
  error?: FieldError;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { containerStyles, className, containerClassname, error, ...props },
    ref
  ) => {
    return (
      <div className={styles.wrapper}>
        <div
          className={classNames(styles.container, containerClassname, {
            [styles.container_error]: !!error?.message,
          })}
          style={containerStyles}
        >
          <input
            ref={ref}
            className={classNames(styles.input, className)}
            {...props}
          />
        </div>
        {error?.message && (
          <span className={styles.error}>{error.message}</span>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";
