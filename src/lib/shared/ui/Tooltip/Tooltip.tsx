import styles from "./Tooltip.module.scss";
import classNames from "classnames";
import { createPortal } from "react-dom";
import { FC, ReactNode, RefObject, useMemo } from "react";

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

  const tooltip = useMemo(
    () =>
      !!positionRect && (
        <div
          style={{
            top: positionRect.top + window.scrollY,
            left: positionRect.x + window.scrollX,
            maxWidth: positionRect.width,
            position: isFixed ? "fixed" : "absolute",
            transform: `translate(calc(-50% + ${
              positionRect.width / 2
            }px), calc(-100% - 5px))`,
          }}
          className={classNames(styles.tooltip, className, {
            [styles.tooltip_active]: isActive,
          })}
        >
          {children}
        </div>
      ),
    [children, className, isActive, isFixed, positionRect]
  );

  return isActive && !!positionRect
    ? createPortal(tooltip, root || document.body)
    : null;
};
