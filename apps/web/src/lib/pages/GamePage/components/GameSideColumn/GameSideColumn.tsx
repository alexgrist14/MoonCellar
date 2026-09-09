"use client";

import { FC } from "react";
import styles from "./GameSideColumn.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { GameExternalPages } from "@/src/lib/entities/game/ui/GameExternalPages";
import { GameLinksBlock } from "@/src/lib/entities/game/ui/GameLinksBlock";
import {
  GameFriendsStatus,
  useGameFriendsStatus,
} from "@/src/lib/features/game/GameFriendsStatus";
import { IGameResponse } from "@mooncellar/schemas";
import {
  getGameExternalPages,
  getGameLinks,
} from "@/src/lib/shared/utils/links.utils";

interface IGameSideColumnProps {
  game: IGameResponse;
  className?: string;
}

export const GameSideColumn: FC<IGameSideColumnProps> = ({
  game,
  className,
}) => {
  const friends = useGameFriendsStatus(game._id);

  const hasContent =
    !!getGameExternalPages(game).length ||
    !!getGameLinks(game).length ||
    !!friends.length;

  if (!hasContent) return null;

  return (
    <Box
      className={className}
      wrapperStyle={{ height: "auto" }}
      templateStyle={{ height: "100%" }}
      classNameContent={styles.side}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <GameExternalPages game={game} isBoxed={false} />
      <GameFriendsStatus gameId={game._id} isBoxed={false} />
      <GameLinksBlock game={game} isBoxed={false} />
    </Box>
  );
};
