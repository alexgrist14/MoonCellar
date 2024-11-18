import React, {
  ButtonHTMLAttributes,
  forwardRef,
  ReactNode,
  useEffect,
  useRef,
  useState,
} from "react";
import cl from "classnames";
import styles from "./Button.module.scss";
import { IButtonColor } from "../../types/buttons";
import { createPortal } from "react-dom";

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
  tooltip?: string | ReactNode;
}

export const Button = forwardRef(
  (
    {
      children,
      className,
      disabled,
      active,
      tooltip,
      color = "default",
      ...props
    }: IButton,
    ref
  ) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const tooltipRef = useRef<HTMLSpanElement>(null);

    const [isHover, setIsHover] = useState(false);
    const [tooltipCoords, setTooltipCoords] = useState([0, 0]);

    useEffect(() => {
      const rect = buttonRef.current?.getBoundingClientRect();
      const tooltipRect = tooltipRef.current?.getBoundingClientRect();

      if (
        isHover &&
        !tooltipCoords[0] &&
        !tooltipCoords[1] &&
        !!tooltipRect &&
        !!rect
      ) {
        setTooltipCoords([
          rect.x,
          window.scrollY + rect.y - 5 - tooltipRect.height,
        ]);
      }
    }, [tooltipCoords, isHover]);

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
        onMouseOver={() => setIsHover(true)}
        onMouseOut={() => setIsHover(false)}
        className={cl(
          styles.button,
          styles[`button_${color}Color`],
          className,
          {
            [styles.button_active]: active,
            [styles[`button_${color}Color_active`]]: active,
            [styles.button_disabled]: disabled,
          }
        )}
        disabled={disabled}
      >
        {children}
        {!!tooltip &&
          isHover &&
          createPortal(
            <span
              ref={tooltipRef}
              style={
                !!tooltipCoords[0] && !!tooltipCoords[1]
                  ? {
                      top: tooltipCoords[1],
                      left: tooltipCoords[0],
                    }
                  : {}
              }
              className={styles.button__tooltip}
            >
              {tooltip}
            </span>,
            document.body
          )}
      </button>
    );
  }
);

Button.displayName = "Button";
