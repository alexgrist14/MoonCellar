"use client";

import {
  CSSProperties,
  FC,
  ReactNode,
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import classNames from "classnames";
import styles from "./Popover.module.scss";
import { Box } from "../Box";
import { commonUtils } from "../../utils/common.utils";
import useCloseEvents from "../../hooks/useCloseEvents";

interface IPopoverProps {
  children: ReactNode;
  anchorRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  onClose: () => void;
  align?: "start" | "end";
  className?: string;
  classNameContent?: string;
  contentStyle?: CSSProperties;
  title?: string;
  width?: string;
}

const GAP = 8;
const VIEWPORT_PADDING = 8;

export const Popover: FC<IPopoverProps> = ({
  children,
  anchorRef,
  isOpen,
  onClose,
  align = "start",
  className,
  classNameContent,
  contentStyle = { padding: "var(--padding-x4)" },
  title,
  width,
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useCloseEvents(
    [anchorRef as RefObject<HTMLElement>, popoverRef],
    useCallback(() => onClose(), [onClose])
  );

  const connector = commonUtils.checkWindow(
    () => document.getElementById("dropdown-connector") ?? document.body
  );

  useLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const anchorRect = anchorRef.current?.getBoundingClientRect();
      const popoverRect = popoverRef.current?.getBoundingClientRect();

      if (!anchorRect || !popoverRect) return;

      const { width, height } = popoverRect;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - anchorRect.bottom - GAP;
      const spaceAbove = anchorRect.top - GAP;
      const isFlipped = height > spaceBelow && spaceAbove > spaceBelow;

      const top = isFlipped
        ? anchorRect.top - GAP - height
        : anchorRect.bottom + GAP;
      const left = align === "end" ? anchorRect.right - width : anchorRect.left;

      setCoords({
        top: Math.max(
          VIEWPORT_PADDING,
          Math.min(top, viewportHeight - height - VIEWPORT_PADDING)
        ),
        left: Math.max(
          VIEWPORT_PADDING,
          Math.min(left, viewportWidth - width - VIEWPORT_PADDING)
        ),
      });
    };

    updateCoords();

    const observer = new ResizeObserver(updateCoords);

    popoverRef.current && observer.observe(popoverRef.current);

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, anchorRef, align]);

  if (!isOpen || !connector) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={classNames(styles.popover, className)}
      style={{
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        visibility: coords ? "visible" : "hidden",
        ...(!!width && { width }),
      }}
      onClick={(event) => event.preventDefault()}
    >
      <Box
        isWithBlur
        title={title}
        isTitleStart={!!title}
        classNameContent={classNameContent}
        contentStyle={contentStyle}
      >
        {children}
      </Box>
    </div>,
    connector
  );
};
