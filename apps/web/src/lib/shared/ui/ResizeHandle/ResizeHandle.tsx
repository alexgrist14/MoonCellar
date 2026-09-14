import { FC, MouseEvent, RefObject, useCallback } from "react";
import classNames from "classnames";
import styles from "./ResizeHandle.module.scss";
import { SvgResize } from "../svg";
import { ISvgSizes } from "../../types/common.type";

interface IResizeHandleProps {
  targetRef: RefObject<HTMLElement | null>;
  isCentered?: boolean;
  minWidth?: number;
  minHeight?: number;
  maxWidthRatio?: number;
  maxHeightRatio?: number;
  size?: ISvgSizes;
  className?: string;
}

export const ResizeHandle: FC<IResizeHandleProps> = ({
  targetRef,
  isCentered,
  minWidth = 300,
  minHeight = 240,
  maxWidthRatio = 0.95,
  maxHeightRatio = 0.92,
  size = "16",
  className,
}) => {
  const startCallback = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      const element = targetRef.current;

      if (!element) return;

      e.preventDefault();
      e.stopPropagation();

      const { width, height } = element.getBoundingClientRect();
      const startX = e.clientX;
      const startY = e.clientY;
      const speed = isCentered ? 2 : 1;

      const move = (event: globalThis.MouseEvent) => {
        const nextWidth = Math.min(
          Math.max(width + (event.clientX - startX) * speed, minWidth),
          window.innerWidth * maxWidthRatio
        );
        const nextHeight = Math.min(
          Math.max(height + (event.clientY - startY) * speed, minHeight),
          window.innerHeight * maxHeightRatio
        );

        element.style.setProperty("--resize-width", `${nextWidth}px`);
        element.style.setProperty("--resize-height", `${nextHeight}px`);
      };

      const stop = () => {
        document.removeEventListener("mousemove", move);
        document.removeEventListener("mouseup", stop);
        document.body.style.removeProperty("user-select");
      };

      document.body.style.setProperty("user-select", "none");
      document.addEventListener("mousemove", move);
      document.addEventListener("mouseup", stop);
    },
    [targetRef, isCentered, minWidth, minHeight, maxWidthRatio, maxHeightRatio]
  );

  return (
    <div
      role="separator"
      aria-label="Resize"
      className={classNames(styles.handle, className)}
      onMouseDown={startCallback}
    >
      <SvgResize size={size} />
    </div>
  );
};
