"use client";

import { FC, RefObject } from "react";
import styles from "./GameRatingPopover.module.scss";
import { GameRating } from "@/src/lib/features/game/ui/GameRating";
import { IGameResponse } from "@mooncellar/schemas";
import { Popover } from "@/src/lib/shared/ui/Popover";

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
}) => (
  <Popover
    anchorRef={anchorRef}
    isOpen={isOpen}
    onClose={onClose}
    width="var(--game-rating-popover-width)"
  >
    <GameRating game={game} className={styles.rating} />
  </Popover>
);
