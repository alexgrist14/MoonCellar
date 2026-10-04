import {
  CSSProperties,
  InputHTMLAttributes,
  ReactNode,
  forwardRef,
} from "react";
import styles from "./Input.module.scss";
import classNames from "classnames";
import type { FieldError } from "react-hook-form";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  containerStyles?: CSSProperties;
  containerClassname?: string;
  error?: FieldError | string;
  helpText?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      containerStyles,
      className,
      containerClassname,
      error,
      helpText,
      ...props
    },
    ref
  ) => {
    const errorMessage = typeof error === "string" ? error : error?.message;

    return (
      <div className={styles.wrapper}>
        <div
          className={classNames(styles.container, containerClassname, {
            [styles.container_error]: !!errorMessage,
            [styles.container_withHelp]: !!helpText,
          })}
          style={containerStyles}
        >
          <input
            ref={ref}
            className={classNames(styles.input, className)}
            {...props}
          />
          {!!helpText && <span className={styles.help}>{helpText}</span>}
        </div>
        {!!errorMessage && <span className={styles.error}>{errorMessage}</span>}
      </div>
    );
  }
);

Input.displayName = "Input";
