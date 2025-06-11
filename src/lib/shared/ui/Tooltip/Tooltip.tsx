import styles from "./Tooltip.module.scss";
import classNames from "classnames";
import { createPortal } from "react-dom";
import {
  FC,
  ReactNode,
  RefObject,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface ITooltipProps {
  isActive?: boolean;
  isFixed?: boolean;
  root?: HTMLDivElement | null;
  positionRef: RefObject<HTMLElement | null>;
  children?: ReactNode;
  className?: string;
  tooltipAlign?: "left" | "right" | "center";
}

export const Tooltip: FC<ITooltipProps> = ({
  isActive,
  isFixed,
  children,
  className,
  root,
  positionRef,
  tooltipAlign = "center",
}) => {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [tooltipCoords, setTooltipCoords] = useState([0, 0]);

  useEffect(() => {
    const rect = positionRef.current?.getBoundingClientRect();
    const tooltipRect = tooltipRef.current?.getBoundingClientRect();

    if (isActive && !!tooltipRect && !!rect) {
      const x =
        tooltipAlign === "left"
          ? rect.x
          : tooltipAlign === "right"
            ? rect.x + rect.width - tooltipRect.width
            : rect.x + rect.width / 2 - tooltipRect.width / 2;

      setTooltipCoords([x, window.scrollY + rect.y - 5 - tooltipRect.height]);
    }
  }, [isActive, tooltipAlign, positionRef]);

  const tooltip = useMemo(
    () => (
      <div
        ref={tooltipRef}
        style={{
          position: isFixed ? "fixed" : "absolute",
          ...(!!tooltipCoords[0] &&
            !!tooltipCoords[1] && {
              top: tooltipCoords[1],
              left: tooltipCoords[0],
            }),
        }}
        className={classNames(styles.tooltip, className)}
      >
        {children}
      </div>
    ),
    [children, tooltipCoords, isFixed, className]
  );

  return isActive
    ? createPortal(
        tooltip,
        root || document.getElementById("tooltip-connector") || document.body
      )
    : null;
};
