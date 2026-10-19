import { FC } from "react";
import styles from "./GameScoreColumn.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { GameHltbBlock } from "@/src/lib/entities/game/ui/GameHltbBlock";
import { GameRatingsBlock } from "@/src/lib/entities/game/ui/GameRatingsBlock";
import { IGameResponse } from "@mooncellar/schemas";
import { getHltbTiles } from "@/src/lib/shared/utils/hltb.utils";
import { getGameRatingRows } from "@/src/lib/shared/utils/rating.utils";
import { GameVndbBlock } from "@/src/lib/entities/game/ui/GameVndbBlock";
import { IPortGameAchievements } from "@/src/lib/entities/port-achievement/model";
import {
  GameAchievementsBlock,
  getAchievementCounts,
} from "@/src/lib/widgets/game/GameAchievementsBlock";

interface IGameScoreColumnProps {
  game: IGameResponse;
  portAchievements?: IPortGameAchievements;
  className?: string;
}

export const GameScoreColumn: FC<IGameScoreColumnProps> = ({
  game,
  portAchievements,
  className,
}) => {
  const achievements = getAchievementCounts(game);

  if (
    !getGameRatingRows(game).length &&
    !getHltbTiles(game).length &&
    !achievements.steam &&
    !achievements.retroachievements &&
    !portAchievements?.total
  ) {
    return null;
  }

  return (
    <Box
      className={className}
      wrapperStyle={{ height: "auto" }}
      templateStyle={{ height: "100%" }}
      classNameContent={styles.score}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <GameRatingsBlock game={game} isBoxed={false} />
      <GameHltbBlock game={game} isBoxed={false} />
      <GameVndbBlock game={game} isBoxed={false} />
      <GameAchievementsBlock
        game={game}
        portAchievements={portAchievements}
        isBoxed={false}
      />
    </Box>
  );
};
