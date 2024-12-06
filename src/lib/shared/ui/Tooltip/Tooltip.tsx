import styles from "./Tooltip.module.scss";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { FC, ReactNode, RefObject } from "react";

interface ITooltipProps {
  isActive?: boolean;
  isFixed?: boolean;
  root?: HTMLDivElement | null;
  positionRef: RefObject<HTMLElement>;
  children?: ReactNode;
  className?: string;
}

export const Tooltip: FC<ITooltipProps> = ({
  isActive,
  isFixed,
  children,
  className,
  root,
  positionRef,
}) => {
  const positionRect = positionRef.current?.getBoundingClientRect();

  return isActive && !!positionRect
    ? createPortal(
        <div
          style={{
            top: positionRect.top + window.scrollY,
            left: positionRect.x + window.scrollX,
            maxWidth: positionRect.width,
            position: isFixed ? "fixed" : "absolute",
          }}
          className={classNames(styles.tooltip, className, {
            [styles.tooltip_active]: isActive,
          })}
        >
          {children}
        </div>,
        root || document.body
      )
    : null;
};
