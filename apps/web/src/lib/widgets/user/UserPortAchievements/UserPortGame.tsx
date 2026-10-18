import { FC } from "react";
import classNames from "classnames";
import Link from "next/link";
import { IGamePlayerGameAchievements } from "@mooncellar/schemas";
import { useGameBySlugQuery } from "@/src/lib/entities/game/api/game.queries";
import { usePortPlayerAchievementsQuery } from "@/src/lib/entities/port-achievement/api";
import {
  getPortAchievementDescription,
  getPortAchievementProgress,
  getPortAchievementTitle,
  getPortAchievementUnlockedAt,
  isPortAchievementUnlocked,
} from "@/src/lib/entities/port-achievement/model";
import { PortAchievementIcon } from "@/src/lib/entities/port-achievement/ui/PortAchievementIcon";
import { GameCard, GameCardSkeleton } from "@/src/lib/widgets/game/GameCard";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./UserPortAchievements.module.scss";

const CARD_STYLE = {
  width: "100%",
  minWidth: 0,
  maxWidth: "none",
  maxHeight: "none",
  padding: 0,
};

interface IUserPortGameProps {
  userId: string;
  summary: IGamePlayerGameAchievements;
  siteGame?: string | null;
}

// One port on the profile: the site's game card, how much is unlocked and every achievement
export const UserPortGame: FC<IUserPortGameProps> = ({
  userId,
  summary,
  siteGame,
}) => {
  const { data: game, isLoading: isGameLoading } = useGameBySlugQuery(siteGame);
  const { data: player } = usePortPlayerAchievementsQuery(summary.game, userId);
  // The service's own name is a fallback for a port without a page on the site
  const name = game?.name ?? summary.name;
  const hasCard = !!game || isGameLoading;
  const percent = summary.total
    ? Math.floor((summary.unlocked * 100) / summary.total)
    : 0;

  return (
    <div
      className={classNames(styles.game, { [styles.game_withCard]: hasCard })}
    >
      {hasCard && (
        <div className={styles.game__card}>
          {game ? (
            <GameCard game={game} style={CARD_STYLE} />
          ) : (
            <GameCardSkeleton style={CARD_STYLE} />
          )}
        </div>
      )}
      <div className={styles.game__body}>
        <div className={styles.game__head}>
          {isGameLoading ? (
            <Skeleton shape="text" width="40%" />
          ) : game ? (
            <Link href={`/games/${game.slug}`} className={styles.game__name}>
              {name}
            </Link>
          ) : (
            <span className={styles.game__name}>{name}</span>
          )}
          <span className={styles.game__count}>
            {summary.unlocked} of {summary.total} · {percent}%
          </span>
        </div>
        <ProgressBar
          value={summary.unlocked}
          max={Math.max(summary.total, 1)}
          tone="accent"
          aria-label={`${summary.unlocked} of ${summary.total} achievements in ${name}`}
        />
        {!!summary.lastUnlockedAt && (
          <span className={styles.game__date}>
            Last unlocked {commonUtils.formatDate(summary.lastUnlockedAt)}
          </span>
        )}
        {!!player && (
          <ul className={styles.game__icons}>
            {player.achievements.map((achievement) => {
              const isUnlocked = isPortAchievementUnlocked(achievement);
              const unlockedAt = getPortAchievementUnlockedAt(achievement);
              const progress = getPortAchievementProgress(achievement);
              const title = getPortAchievementTitle(achievement);

              return (
                <li key={achievement.key}>
                  <Tooltip
                    content={
                      <span className={styles.game__tip}>
                        <strong>{title}</strong>
                        <span>
                          {getPortAchievementDescription(achievement)}
                        </span>
                        {isUnlocked && !!unlockedAt && (
                          <span>
                            Unlocked {commonUtils.formatDate(unlockedAt)}
                          </span>
                        )}
                        {!!progress && <span>{progress.label}</span>}
                      </span>
                    }
                  >
                    <span
                      className={styles.game__icon}
                      tabIndex={0}
                      aria-label={`${title}${isUnlocked ? ", unlocked" : ""}`}
                    >
                      <PortAchievementIcon
                        icon={achievement.icon}
                        isUnlocked={isUnlocked}
                        size="sm"
                      />
                    </span>
                  </Tooltip>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
