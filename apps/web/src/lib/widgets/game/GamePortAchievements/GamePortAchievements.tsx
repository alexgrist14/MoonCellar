"use client";

import { FC } from "react";
import styles from "./GamePortAchievements.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useIsAuthHydrated } from "@/src/lib/shared/hooks/useIsAuthHydrated";
import { usePortPlayerAchievementsQuery } from "@/src/lib/entities/port-achievement/api";
import {
  IPortGameAchievements,
  mergePortAchievements,
} from "@/src/lib/entities/port-achievement/model";
import { PortAchievementCard } from "@/src/lib/entities/port-achievement/ui/PortAchievementCard";

const PORT_ACHIEVEMENTS_ANCHOR = "port-achievements";

interface IGamePortAchievementsProps {
  achievements: IPortGameAchievements;
}

// The catalogue comes with the server render; the viewer's own states load in the browser
export const GamePortAchievements: FC<IGamePortAchievementsProps> = ({
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
      id={PORT_ACHIEVEMENTS_ANCHOR}
      title="MoonCellar Team port"
      titleCount={achievements.total}
      isTitleStart
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <div className={styles.port}>
        <p className={styles.port__note}>
          Achievements of the PC port by MoonCellar Team. They unlock in the
          game and reach this page through the player&apos;s MoonCellar account.
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
