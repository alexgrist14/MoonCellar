"use client";

import { FC, RefObject } from "react";
import styles from "./GameSteamPopover.module.scss";
import { ISteamProgress } from "@mooncellar/schemas";
import { Popover } from "@/src/lib/shared/ui/Popover";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Button } from "@/src/lib/shared/ui/Button";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";

interface IGameSteamPopoverProps {
  appId: number;
  total: number;
  progress?: ISteamProgress;
  steamId?: string;
  anchorRef: RefObject<HTMLDivElement | null>;
  isOpen: boolean;
  onClose: () => void;
}

export const GameSteamPopover: FC<IGameSteamPopoverProps> = ({
  appId,
  total,
  progress,
  steamId,
  anchorRef,
  isOpen,
  onClose,
}) => {
  const unlocked = progress?.unlocked ?? 0;
  const isMastered = !!progress && unlocked >= total;
  const percent = Math.floor((unlocked / total) * 100);

  return (
    <Popover
      anchorRef={anchorRef}
      isOpen={isOpen}
      onClose={onClose}
      align="end"
      title="Steam achievements"
    >
      <div className={styles.steam}>
        {progress ? (
          <>
            <div className={styles.steam__head}>
              <span className={styles.steam__count}>
                {unlocked}
                <span className={styles.steam__total}> / {total}</span>
              </span>
              <Badge tone={isMastered ? "attention" : "neutral"}>
                {isMastered ? "Mastered" : "In progress"}
              </Badge>
            </div>
            <progress
              className={styles.steam__progress}
              value={unlocked}
              max={total}
              aria-label={`${unlocked} of ${total} achievements unlocked`}
              data-mastered={isMastered || undefined}
            />
            <p className={styles.steam__sub}>
              {isMastered
                ? progress.masteredAt
                  ? `Mastered on ${commonUtils.formatDate(progress.masteredAt)}`
                  : "Every achievement unlocked"
                : `${percent}% unlocked · ${total - unlocked} left`}
            </p>
          </>
        ) : (
          <>
            <span className={styles.steam__count}>
              {total}
              <span className={styles.steam__total}>
                {" "}
                {commonUtils.addLastS("achievement", total)}
              </span>
            </span>
            <p className={styles.steam__sub}>
              {steamId
                ? "None unlocked yet."
                : "Link a Steam account in Settings to see your progress."}
            </p>
          </>
        )}
        <div className={styles.steam__actions}>
          <Button
            href={
              steamId
                ? `https://steamcommunity.com/profiles/${steamId}/stats/${appId}/achievements`
                : `https://steamcommunity.com/stats/${appId}/achievements`
            }
            target="_blank"
            rel="noreferrer"
          >
            Open achievements
          </Button>
          <Button
            href={`https://store.steampowered.com/app/${appId}`}
            target="_blank"
            rel="noreferrer"
          >
            Open game page
          </Button>
        </div>
      </div>
    </Popover>
  );
};
