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
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { PopoverSheet } from "./PopoverSheet";

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
  matchAnchorWidth?: boolean;
  isSheetDisabled?: boolean;
  reservedHeight?: number;
}

const GAP = 8;
const VIEWPORT_PADDING = 8;

const AnchoredPopover: FC<IPopoverProps> = ({
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
  matchAnchorWidth,
  reservedHeight = 0,
}) => {
  const [coords, setCoords] = useState<{
    top?: number;
    bottom?: number;
    left: number;
    width: number;
  } | null>(null);
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

      const width = matchAnchorWidth ? anchorRect.width : popoverRect.width;
      const { height } = popoverRect;
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      const spaceBelow = viewportHeight - anchorRect.bottom - GAP;
      const spaceAbove = anchorRect.top - GAP;
      const isFlipped =
        Math.max(height, reservedHeight) > spaceBelow &&
        spaceAbove > spaceBelow;

      const left = align === "end" ? anchorRect.right - width : anchorRect.left;
      const vertical = isFlipped
        ? {
            bottom: Math.max(
              VIEWPORT_PADDING,
              Math.min(
                viewportHeight - anchorRect.top + GAP,
                viewportHeight - height - VIEWPORT_PADDING
              )
            ),
          }
        : {
            top: Math.max(
              VIEWPORT_PADDING,
              Math.min(
                anchorRect.bottom + GAP,
                viewportHeight - height - VIEWPORT_PADDING
              )
            ),
          };

      setCoords({
        ...vertical,
        left: Math.max(
          VIEWPORT_PADDING,
          Math.min(left, viewportWidth - width - VIEWPORT_PADDING)
        ),
        width: anchorRect.width,
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
  }, [isOpen, anchorRef, align, matchAnchorWidth, reservedHeight]);

  if (!isOpen || !connector) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={classNames(styles.popover, className)}
      style={{
        top: coords ? coords.top : 0,
        bottom: coords?.bottom,
        left: coords?.left ?? 0,
        visibility: coords ? "visible" : "hidden",
        ...(!!width && { width }),
        ...(matchAnchorWidth && !!coords && { width: coords.width }),
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

export const Popover: FC<IPopoverProps> = (props) => {
  const isMobile = useStatesStore((state) => state.isMobile);

  return isMobile && !props.isSheetDisabled ? (
    <PopoverSheet {...props} />
  ) : (
    <AnchoredPopover {...props} />
  );
};
