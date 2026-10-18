import { FC } from "react";
import classNames from "classnames";
import { ProgressBar } from "@/src/lib/shared/ui/ProgressBar";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { IPortAchievement } from "../../model/port-achievement.type";
import {
  getPortAchievementDescription,
  getPortAchievementProgress,
  getPortAchievementTitle,
  getPortAchievementUnlockedAt,
  isPortAchievementUnlocked,
} from "../../model/port-achievement.utils";
import { PortAchievementIcon } from "../PortAchievementIcon";
import styles from "./PortAchievementCard.module.scss";

interface IPortAchievementCardProps {
  achievement: IPortAchievement;
  className?: string;
}

export const PortAchievementCard: FC<IPortAchievementCardProps> = ({
  achievement,
  className,
}) => {
  const isUnlocked = isPortAchievementUnlocked(achievement);
  const unlockedAt = getPortAchievementUnlockedAt(achievement);
  const progress = getPortAchievementProgress(achievement);
  const title = getPortAchievementTitle(achievement);

  return (
    <article className={classNames(styles.card, className)}>
      <PortAchievementIcon icon={achievement.icon} isUnlocked={isUnlocked} />
      <div className={styles.card__body}>
        <h3 className={styles.card__title}>{title}</h3>
        <p className={styles.card__description}>
          {getPortAchievementDescription(achievement)}
        </p>
        {isUnlocked && (
          <span className={styles.card__unlocked}>
            {unlockedAt
              ? `Unlocked ${commonUtils.formatDate(unlockedAt)}`
              : "Unlocked"}
          </span>
        )}
        {!!progress && (
          <div className={styles.card__progress}>
            <ProgressBar
              value={progress.current}
              max={progress.target}
              tone="accent"
              aria-label={`${title}: ${progress.label}`}
            />
            <span className={styles.card__count}>{progress.label}</span>
          </div>
        )}
      </div>
    </article>
  );
};
