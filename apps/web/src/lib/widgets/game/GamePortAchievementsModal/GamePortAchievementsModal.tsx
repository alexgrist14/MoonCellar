"use client";

import { FC } from "react";
import styles from "./GamePortAchievementsModal.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useIsAuthHydrated } from "@/src/lib/shared/hooks/useIsAuthHydrated";
import { usePortPlayerAchievementsQuery } from "@/src/lib/entities/port-achievement/api";
import {
  IPortGameAchievements,
  mergePortAchievements,
} from "@/src/lib/entities/port-achievement/model";
import { PortAchievementCard } from "@/src/lib/entities/port-achievement/ui/PortAchievementCard";

export const GAME_PORT_ACHIEVEMENTS_MODAL_ID = "game-port-achievements";

interface IGamePortAchievementsModalProps {
  achievements: IPortGameAchievements;
}

// The catalogue comes with the server render; the viewer's own states load in the browser
export const GamePortAchievementsModal: FC<IGamePortAchievementsModalProps> = ({
  achievements,
}) => {
  const isHydrated = useIsAuthHydrated();
  const profileId = useAuthStore((state) => state.profile?._id);
  const { data: player } = usePortPlayerAchievementsQuery(
    achievements.game,
    isHydrated ? profileId : undefined
  );
  const items = mergePortAchievements(
    achievements.achievements,
    player?.achievements
  );

  return (
    <Box
      title={achievements.port.name}
      titleCount={achievements.total}
      isTitleStart
      onClose={() => modal.close(GAME_PORT_ACHIEVEMENTS_MODAL_ID)}
      isWithScrollBar
      wrapperStyle={{ width: "var(--game-port-achievements-modal-width)" }}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <div className={styles.port}>
        <p className={styles.port__note}>
          Achievements of {achievements.port.name}, the PC port by MoonCellar
          Team. They unlock in the game and reach this page through the
          player&apos;s MoonCellar account.
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
          {items.map((achievement) => (
            <li key={achievement.key} className={styles.port__item}>
              <PortAchievementCard achievement={achievement} />
            </li>
          ))}
        </ul>
      </div>
    </Box>
  );
};
