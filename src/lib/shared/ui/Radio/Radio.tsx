import { FC, InputHTMLAttributes } from "react";
import styles from "./Radio.module.scss";
import classNames from "classnames";

interface IRadioProps
  extends Pick<
    InputHTMLAttributes<HTMLInputElement>,
    "required" | "disabled" | "onChange" | "id" | "checked" | "className"
  > {
  name?: string;
}

export const Radio: FC<IRadioProps> = ({ className, name, ...props }) => {
  return (
    <input
      className={classNames(styles.radio, className)}
      type="radio"
      name={name}
      {...props}
    />
  );
};
