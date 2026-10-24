"use client";

import { FC } from "react";
import styles from "./GamePortAchievementsModal.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useIsAuthHydrated } from "@/src/lib/shared/hooks/useIsAuthHydrated";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { IGameAchievementList, IGameDefinitionInfo } from "@mooncellar/schemas";
import {
  usePortAchievementsQuery,
  usePortPlayerAchievementsQuery,
} from "@/src/lib/entities/port-achievement/api";
import { mergePortAchievements } from "@/src/lib/entities/port-achievement/model";
import { PortAchievementCard } from "@/src/lib/entities/port-achievement/ui/PortAchievementCard";

export const GAME_PORT_ACHIEVEMENTS_MODAL_ID = "game-port-achievements";

interface IGamePortAchievementsModalProps {
  port: IGameDefinitionInfo;
  achievements?: IGameAchievementList;
}

// The game page passes the catalogue from its server render, a game card lets it load here; the
// viewer's own states always load in the browser
export const GamePortAchievementsModal: FC<IGamePortAchievementsModalProps> = ({
  port,
  achievements,
}) => {
  const isHydrated = useIsAuthHydrated();
  const profileId = useAuthStore((state) => state.profile?._id);
  const { data: loaded } = usePortAchievementsQuery(port.slug, !achievements);
  const catalogue = achievements ?? loaded;
  const { data: player } = usePortPlayerAchievementsQuery(
    port.slug,
    isHydrated ? profileId : undefined
  );
  const items = catalogue
    ? mergePortAchievements(catalogue.achievements, player?.achievements)
    : [];

  return (
    <Box
      title={port.name}
      titleCount={catalogue?.total ?? port.achievements}
      isTitleStart
      onClose={() => modal.close(GAME_PORT_ACHIEVEMENTS_MODAL_ID)}
      isWithScrollBar
      wrapperStyle={{ width: "var(--game-port-achievements-modal-width)" }}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <div className={styles.port}>
        <p className={styles.port__note}>
          Achievements of {port.name}, the PC port by MoonCellar Team. They
          unlock in the game and reach this page through the player&apos;s
          MoonCellar account.
        </p>
        {!!player && (
          <div className={styles.port__summary}>
            <span className={styles.port__count}>
              You have {player.unlocked} of {player.total}
            </span>
            <ProgressBar
              value={player.unlocked}
              max={Math.max(player.total, 1)}
              tone="accent"
              aria-label={`You have ${player.unlocked} of ${player.total} achievements`}
            />
          </div>
        )}
        <ul className={styles.port__grid}>
          {catalogue
            ? items.map((achievement) => (
                <li key={achievement.key} className={styles.port__item}>
                  <PortAchievementCard achievement={achievement} />
                </li>
              ))
            : Array.from({ length: port.achievements }, (_, index) => (
                <li key={index} className={styles.port__item}>
                  <Skeleton
                    height="calc(var(--achievements-icon-size) + 2 * var(--padding-x3))"
                    radius="var(--radius-x3)"
                  />
                </li>
              ))}
        </ul>
      </div>
    </Box>
  );
};
