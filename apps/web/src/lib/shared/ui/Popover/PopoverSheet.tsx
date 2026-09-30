"use client";

import {
  CSSProperties,
  FC,
  PointerEvent,
  ReactNode,
  RefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import styles from "./Popover.module.scss";
import { Button, ButtonColor } from "../Button";
import { SvgClose } from "../svg";
import { EXPAND_KEEP_OPEN_ATTRIBUTE } from "../ExpandMenu";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import { useDisableScroll } from "@/src/lib/shared/hooks/useDisableScroll";

interface IPopoverSheetProps {
  children: ReactNode;
  anchorRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  className?: string;
  classNameContent?: string;
  contentStyle?: CSSProperties;
  title?: string;
  sheetRef?: RefObject<HTMLDivElement | null>;
}

const DISMISS_SHARE = 1 / 3;
const DISMISS_VELOCITY = 0.5;
const UPWARD_RESISTANCE = 4;
const CLOSE_FALLBACK_MS = 600;

export const PopoverSheet: FC<IPopoverSheetProps> = ({
  children,
  anchorRef,
  isOpen,
  onClose,
  className,
  classNameContent,
  contentStyle,
  title,
  sheetRef: externalSheetRef,
}) => {
  const ownSheetRef = useRef<HTMLDivElement>(null);
  const sheetRef = externalSheetRef ?? ownSheetRef;
  const drag = useRef({ startY: 0, lastY: 0, lastTime: 0, velocity: 0 });
  const [offset, setOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useCloseEvents(
    [anchorRef as RefObject<HTMLElement>, sheetRef],
    useCallback(() => onClose(), [onClose])
  );
  useDisableScroll(isOpen);

  useEffect(() => {
    if (isOpen) return;

    setOffset(0);
    setIsDragging(false);
    setIsClosing(false);
  }, [isOpen]);

  useEffect(() => {
    if (!isClosing) return;

    const timeout = setTimeout(onClose, CLOSE_FALLBACK_MS);

    return () => clearTimeout(timeout);
  }, [isClosing, onClose]);

  const connector = commonUtils.checkWindow(
    () => document.getElementById("dropdown-connector") ?? document.body
  );

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if ((event.target as HTMLElement).closest("button")) return;

    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startY: event.clientY,
      lastY: event.clientY,
      lastTime: performance.now(),
      velocity: 0,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;

    const now = performance.now();
    const state = drag.current;

    state.velocity =
      (event.clientY - state.lastY) / Math.max(now - state.lastTime, 1);
    state.lastY = event.clientY;
    state.lastTime = now;

    const distance = event.clientY - state.startY;

    setOffset(distance < 0 ? distance / UPWARD_RESISTANCE : distance);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;

    setIsDragging(false);

    const height = sheetRef.current?.offsetHeight ?? 0;

    if (
      drag.current.velocity > DISMISS_VELOCITY ||
      offset > height * DISMISS_SHARE
    ) {
      setIsClosing(true);
      return;
    }

    setOffset(0);
  };

  if (!isOpen || !connector) return null;

  return createPortal(
    <div className={styles.sheetRoot} {...{ [EXPAND_KEEP_OPEN_ATTRIBUTE]: "" }}>
      <div className={styles.sheetRoot__backdrop} />
      <div
        ref={sheetRef}
        role="dialog"
        aria-modal
        aria-label={title}
        className={classNames(styles.sheet, className, {
          [styles.sheet_dragging]: isDragging,
        })}
        style={{
          transform: isClosing ? "translateY(100%)" : `translateY(${offset}px)`,
        }}
        onTransitionEnd={() => isClosing && onClose()}
        onClick={(event) => event.preventDefault()}
      >
        <div
          className={styles.sheet__handle}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <span className={styles.sheet__grabber} aria-hidden="true" />
          <div className={styles.sheet__head}>
            {title && <h3 className={styles.sheet__title}>{title}</h3>}
            <Button
              className={styles.sheet__close}
              color={ButtonColor.TRANSPARENT}
              aria-label="Close"
              isOnlyIcon
              onClick={onClose}
            >
              <SvgClose />
            </Button>
          </div>
        </div>
        <div
          className={classNames(styles.sheet__body, classNameContent)}
          style={contentStyle}
        >
          {children}
        </div>
      </div>
    </div>,
    connector
  );
};
