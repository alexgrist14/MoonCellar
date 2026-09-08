"use client";

import { FC, RefObject, useCallback, useEffect, useRef, useState } from "react";
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

  useEffect(() => {
    if (!isOpen) return;

    const updateCoords = () => {
      const rect = anchorRef.current?.getBoundingClientRect();

      if (!rect) return;

      const width = parseInt(
        getComputedStyle(document.documentElement).getPropertyValue(
          "--game-rating-popover-width"
        )
      );

      setCoords({
        top: rect.bottom + 8,
        left: Math.max(8, Math.min(rect.left, window.innerWidth - width - 8)),
      });
    };

    updateCoords();

    window.addEventListener("scroll", updateCoords, true);
    window.addEventListener("resize", updateCoords);

    return () => {
      window.removeEventListener("scroll", updateCoords, true);
      window.removeEventListener("resize", updateCoords);
    };
  }, [isOpen, anchorRef]);

  if (!isOpen || !coords || !connector) return null;

  return createPortal(
    <div
      ref={popoverRef}
      className={styles.popover}
      style={{ top: coords.top, left: coords.left }}
      onClick={(event) => event.preventDefault()}
    >
      <Box isWithBlur contentStyle={{ padding: "var(--padding-x4)" }}>
        <GameRating game={game} className={styles.popover__rating} />
      </Box>
    </div>,
    connector
  );
};
