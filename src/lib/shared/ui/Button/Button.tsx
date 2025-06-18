import React, {
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  FC,
  ReactNode,
  useRef,
  useState,
} from "react";
import cl from "classnames";
import styles from "./Button.module.scss";
import { Tooltip } from "../Tooltip";

type IButtonColor =
  | "default"
  | "accent"
  | "red"
  | "green"
  | "greenBorder"
  | "transparent"
  | "fancy";

export interface IButtonProps
  extends Pick<
    DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    >,
    | "children"
    | "disabled"
    | "type"
    | "className"
    | "onClick"
    | "form"
    | "style"
    | "ref"
  > {
  color?: IButtonColor;
  active?: boolean;
  tooltip?: string | ReactNode;
  tooltipAlign?: "left" | "right" | "center";
  compact?: boolean;
  hidden?: boolean;
}

export const Button: FC<IButtonProps> = ({
  children,
  className,
  active,
  tooltip,
  color = "default",
  tooltipAlign,
  compact,
  hidden,
  ref,
  ...props
}) => {
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  const [isHover, setIsHover] = useState(false);

  return (
    <button
      {...props}
      ref={(node) => {
        buttonRef.current = node;

        if (typeof ref === "function") {
          ref(node);
        } else if (ref) {
          ref.current = node;
        }
      }}
      onMouseEnter={() => setIsHover(true)}
      onMouseLeave={() => setIsHover(false)}
      onMouseDown={() => setIsHover(false)}
      onTouchEnd={() => setIsHover(false)}
      onBlur={() => setIsHover(false)}
      className={cl(styles.button, styles[`button_${color}Color`], className, {
        [styles.button_active]: active,
        [styles[`button_${color}Color_active`]]: active,
        [styles.button_compact]: compact,
        [styles.button_hidden]: hidden,
      })}
    >
      {children}
      {!!tooltip && (
        <Tooltip
          positionRef={buttonRef}
          isActive={isHover}
          tooltipAlign={tooltipAlign}
        >
          {tooltip}
        </Tooltip>
      )}
    </button>
  );
};
