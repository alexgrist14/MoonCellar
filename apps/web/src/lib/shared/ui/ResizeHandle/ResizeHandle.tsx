import { FC, MouseEvent, RefObject, useCallback } from "react";
import classNames from "classnames";
import styles from "./ResizeHandle.module.scss";
import { SvgResize } from "../svg";
import { ISvgSizes } from "@/src/lib/shared/types/common.type";

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

type IResizeProperty = "--resize-width" | "--resize-height";

const SIZE_FIT_ATTEMPTS = 3;

const getSizeOffset = (
  element: HTMLElement,
  property: IResizeProperty,
  size: number
) => {
  let value = size;

  for (let attempt = 0; attempt < SIZE_FIT_ATTEMPTS; attempt++) {
    element.style.setProperty(property, `${value}px`);

    const rect = element.getBoundingClientRect();
    const difference =
      size - (property === "--resize-width" ? rect.width : rect.height);

    if (Math.abs(difference) < 0.5) break;

    value += difference;
  }

  return size - value;
};

const restoreProperty = (
  element: HTMLElement,
  property: IResizeProperty,
  value: string
) =>
  value
    ? element.style.setProperty(property, value)
    : element.style.removeProperty(property);

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

      const initialWidth = element.style.getPropertyValue("--resize-width");
      const initialHeight = element.style.getPropertyValue("--resize-height");
      const widthOffset = getSizeOffset(element, "--resize-width", width);
      const heightOffset = getSizeOffset(element, "--resize-height", height);

      restoreProperty(element, "--resize-width", initialWidth);
      restoreProperty(element, "--resize-height", initialHeight);

      const move = (event: globalThis.MouseEvent) => {
        const nextWidth = Math.min(
          Math.max(
            width + (event.clientX - startX) * speed,
            Math.min(minWidth, width)
          ),
          Math.max(window.innerWidth * maxWidthRatio, width)
        );
        const nextHeight = Math.min(
          Math.max(
            height + (event.clientY - startY) * speed,
            Math.min(minHeight, height)
          ),
          Math.max(window.innerHeight * maxHeightRatio, height)
        );

        element.style.setProperty(
          "--resize-width",
          `${nextWidth - widthOffset}px`
        );
        element.style.setProperty(
          "--resize-height",
          `${nextHeight - heightOffset}px`
        );
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
