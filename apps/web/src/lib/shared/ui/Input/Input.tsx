import { CSSProperties, InputHTMLAttributes, forwardRef } from "react";
import styles from "./Input.module.scss";
import classNames from "classnames";
import type { FieldError } from "react-hook-form";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerStyles?: CSSProperties;
  containerClassname?: string;
  error?: FieldError | string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    { containerStyles, className, containerClassname, error, ...props },
    ref
  ) => {
    const errorMessage = typeof error === "string" ? error : error?.message;

    return (
      <div className={styles.wrapper}>
        <div
          className={classNames(styles.container, containerClassname, {
            [styles.container_error]: !!errorMessage,
          })}
          style={containerStyles}
        >
          <input
            ref={ref}
            className={classNames(styles.input, className)}
            {...props}
          />
        </div>
        {!!errorMessage && <span className={styles.error}>{errorMessage}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
