import { CSSProperties, FC, InputHTMLAttributes } from "react";
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
  > {
  containerStyles?: CSSProperties;
}

export const Input: FC<InputProps> = ({
  containerStyles,
  className,
  ...props
}) => {
  return (
    <div className={styles.container} style={containerStyles}>
      <input className={classNames(styles.input, className)} {...props} />
    </div>
  );
};

