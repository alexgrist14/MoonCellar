import { FC, KeyboardEvent, PointerEvent, RefObject, useRef } from "react";
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

interface IResizeStart {
  width: number;
  height: number;
  widthOffset: number;
  heightOffset: number;
}

const SIZE_FIT_ATTEMPTS = 3;
const KEYBOARD_STEP = 24;

const KEYBOARD_DELTAS: Record<string, [number, number]> = {
  ArrowLeft: [-KEYBOARD_STEP, 0],
  ArrowRight: [KEYBOARD_STEP, 0],
  ArrowUp: [0, -KEYBOARD_STEP],
  ArrowDown: [0, KEYBOARD_STEP],
};

export const RESIZING_ATTRIBUTE = "data-resizing";

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

const measure = (element: HTMLElement): IResizeStart => {
  element.toggleAttribute(RESIZING_ATTRIBUTE, true);

  const { width, height } = element.getBoundingClientRect();
  const initialWidth = element.style.getPropertyValue("--resize-width");
  const initialHeight = element.style.getPropertyValue("--resize-height");
  const widthOffset = getSizeOffset(element, "--resize-width", width);
  const heightOffset = getSizeOffset(element, "--resize-height", height);

  restoreProperty(element, "--resize-width", initialWidth);
  restoreProperty(element, "--resize-height", initialHeight);

  return { width, height, widthOffset, heightOffset };
};

const finishResize = (element: HTMLElement | null) => {
  element?.getBoundingClientRect();
  element?.removeAttribute(RESIZING_ATTRIBUTE);
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

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
  const drag = useRef<(IResizeStart & { x: number; y: number }) | null>(null);

  const resize = (
    element: HTMLElement,
    start: IResizeStart,
    deltaX: number,
    deltaY: number
  ) => {
    const nextWidth = clamp(
      start.width + deltaX,
      Math.min(minWidth, start.width),
      Math.max(window.innerWidth * maxWidthRatio, start.width)
    );
    const nextHeight = clamp(
      start.height + deltaY,
      Math.min(minHeight, start.height),
      Math.max(window.innerHeight * maxHeightRatio, start.height)
    );

    element.style.setProperty(
      "--resize-width",
      `${nextWidth - start.widthOffset}px`
    );
    element.style.setProperty(
      "--resize-height",
      `${nextHeight - start.heightOffset}px`
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    const element = targetRef.current;

    if (!element || event.button !== 0) return;

    event.preventDefault();
    event.stopPropagation();
    event.currentTarget.setPointerCapture(event.pointerId);

    drag.current = { ...measure(element), x: event.clientX, y: event.clientY };
    document.body.style.setProperty("user-select", "none");
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const element = targetRef.current;
    const start = drag.current;

    if (!element || !start) return;

    const speed = isCentered ? 2 : 1;

    resize(
      element,
      start,
      (event.clientX - start.x) * speed,
      (event.clientY - start.y) * speed
    );
  };

  const handlePointerUp = () => {
    finishResize(targetRef.current);
    drag.current = null;
    document.body.style.removeProperty("user-select");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const element = targetRef.current;
    const delta = KEYBOARD_DELTAS[event.key];

    if (!element || !delta) return;

    event.preventDefault();
    resize(element, measure(element), ...delta);
    finishResize(element);
  };

  return (
    <div
      role="separator"
      aria-label="Resize"
      aria-orientation="vertical"
      tabIndex={0}
      className={classNames(styles.handle, className)}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onKeyDown={handleKeyDown}
    >
      <SvgResize size={size} />
    </div>
  );
};
