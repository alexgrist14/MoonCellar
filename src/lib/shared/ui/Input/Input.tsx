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
  > {
  containerStyles?: CSSProperties;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ containerStyles, className, ...props }, ref) => {
    return (
      <div className={styles.container} style={containerStyles}>
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
