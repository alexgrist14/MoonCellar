"use client";

import {
  FC,
  RefObject,
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import styles from "./GameRatingPopover.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { GameRating } from "@/src/lib/features/game/GameRating";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";

interface IGameRatingPopoverProps {
  game: IGameResponse;
  anchorRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

const GAP = 8;
const VIEWPORT_PADDING = 8;

export const GameRatingPopover: FC<IGameRatingPopoverProps> = ({
  game,
  anchorRef,
  isOpen,
  onClose,
}) => {
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null
  );
  const popoverRef = useRef<HTMLDivElement>(null);

  useCloseEvents(
    [anchorRef, popoverRef],
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

      setCoords({
        top: Math.max(
          VIEWPORT_PADDING,
          Math.min(top, viewportHeight - height - VIEWPORT_PADDING)
        ),
        left: Math.max(
          VIEWPORT_PADDING,
          Math.min(anchorRect.left, viewportWidth - width - VIEWPORT_PADDING)
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
  }, [isOpen, anchorRef]);

  if (!isOpen || !connector) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.popover}
      style={{
        top: coords?.top ?? 0,
        left: coords?.left ?? 0,
        visibility: coords ? "visible" : "hidden",
      }}
      onClick={(event) => event.preventDefault()}
    >
      <Box isWithBlur contentStyle={{ padding: "var(--padding-x4)" }}>
        <GameRating game={game} className={styles.popover__rating} />
      </Box>
    </div>,
    connector
  );
};
