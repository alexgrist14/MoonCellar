import { FC } from "react";
import styles from "./GameScoreColumn.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { GameHltbBlock } from "@/src/lib/entities/game/ui/GameHltbBlock";
import { GameRatingsBlock } from "@/src/lib/entities/game/ui/GameRatingsBlock";
import { IGameResponse } from "@mooncellar/schemas";
import { getHltbTiles } from "@/src/lib/shared/utils/hltb.utils";
import { getGameRatingRows } from "@/src/lib/shared/utils/rating.utils";

interface IGameScoreColumnProps {
  game: IGameResponse;
  className?: string;
}

export const GameScoreColumn: FC<IGameScoreColumnProps> = ({
  game,
  className,
}) => {
  if (!getGameRatingRows(game).length && !getHltbTiles(game).length) {
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
    </Box>
  );
};
