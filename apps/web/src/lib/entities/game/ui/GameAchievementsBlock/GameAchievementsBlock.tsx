import { FC } from "react";
import styles from "./GameAchievementsBlock.module.scss";
import { InfoBlock } from "@/src/lib/shared/ui/InfoBlock";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { SvgAchievement, SvgTrophy } from "@/src/lib/shared/ui/svg";
import { IGameResponse } from "@mooncellar/schemas";

interface IGameAchievementsBlockProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const getAchievementCounts = (game: IGameResponse) => ({
  steam: game.steamAchievements?.total ?? 0,
  retroachievements: (game.retroachievements ?? []).reduce(
    (sum, set) => sum + (set.numAchievements ?? 0),
    0
  ),
});

export const GameAchievementsBlock: FC<IGameAchievementsBlockProps> = ({
  game,
  isBoxed = true,
}) => {
  const { steam, retroachievements } = getAchievementCounts(game);

  if (!steam && !retroachievements) return null;

  return (
    <InfoBlock title="Achievements:" isBoxed={isBoxed}>
      <div className={styles.tiles}>
        {!!steam && (
          <StatTile
            value={
              <span className={styles.value}>
                <SvgTrophy size="20" color="attention" />
                {steam}
              </span>
            }
            label="Steam"
            align="center"
            isLabelBelow
            title={`${steam} achievements on Steam`}
          />
        )}
        {!!retroachievements && (
          <StatTile
            value={
              <span className={styles.value}>
                <SvgAchievement size="20" color="attention" />
                {retroachievements}
              </span>
            }
            label="RetroAchievements"
            align="center"
            isLabelBelow
            title={`${retroachievements} achievements across the RetroAchievements sets`}
          />
        )}
      </div>
    </InfoBlock>
  );
};
