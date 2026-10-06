import { ComponentProps, FC } from "react";
import classNames from "classnames";
import { SvgEye } from "../svg";
import styles from "./SpoilerButton.module.scss";

type ISpoilerButtonProps = Omit<ComponentProps<"button">, "type">;

export const SpoilerButton: FC<ISpoilerButtonProps> = ({
  children,
  className,
  ...props
}) => (
  <button
    type="button"
    className={classNames(styles.spoilerButton, className)}
    {...props}
  >
    <SvgEye size="16" color="attention" />
    {children}
  </button>
);
