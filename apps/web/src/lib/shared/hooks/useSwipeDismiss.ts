import { PointerEvent, RefObject, useCallback, useRef, useState } from "react";

const DISMISS_SHARE = 1 / 3;
const DISMISS_VELOCITY = 0.5;
const SWIPE_THRESHOLD = 10;

interface ISwipe {
  startX: number;
  startY: number;
  lastX: number;
  lastTime: number;
  velocity: number;
  isHorizontal?: boolean;
}

export const useSwipeDismiss = <T extends HTMLElement>({
  ref,
  direction,
  onDismiss,
}: {
  ref: RefObject<T | null>;
  direction: "left" | "right";
  onDismiss: () => void;
}) => {
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const swipe = useRef<ISwipe | null>(null);
  const sign = direction === "right" ? 1 : -1;
  const resetOffset = useCallback(() => setOffset(0), []);

  const onPointerDown = (event: PointerEvent<T>) => {
    if (event.pointerType === "mouse") return;

    swipe.current = {
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastTime: performance.now(),
      velocity: 0,
    };
  };

  const onPointerMove = (event: PointerEvent<T>) => {
    const state = swipe.current;

    if (!state) return;

    const deltaX = (event.clientX - state.startX) * sign;
    const deltaY = event.clientY - state.startY;

    if (state.isHorizontal === undefined) {
      if (Math.max(Math.abs(deltaX), Math.abs(deltaY)) < SWIPE_THRESHOLD) {
        return;
      }

      state.isHorizontal = deltaX > 0 && Math.abs(deltaX) > Math.abs(deltaY);

      if (!state.isHorizontal) return;

      event.currentTarget.setPointerCapture(event.pointerId);
      setIsDragging(true);
    }

    if (!state.isHorizontal) return;

    const now = performance.now();

    state.velocity =
      ((event.clientX - state.lastX) * sign) /
      Math.max(now - state.lastTime, 1);
    state.lastX = event.clientX;
    state.lastTime = now;

    setOffset(Math.max(deltaX, 0));
  };

  const onPointerUp = () => {
    const state = swipe.current;

    swipe.current = null;

    if (!state?.isHorizontal) return;

    setIsDragging(false);

    const width = ref.current?.offsetWidth ?? 0;

    if (state.velocity > DISMISS_VELOCITY || offset > width * DISMISS_SHARE) {
      setOffset(width);
      onDismiss();
      return;
    }

    setOffset(0);
  };

  return {
    offset: offset * sign,
    isDragging,
    resetOffset,
    swipeHandlers: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  };
};
