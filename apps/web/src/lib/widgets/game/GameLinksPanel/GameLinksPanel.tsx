import { FC } from "react";
import styles from "./GameLinksPanel.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { GameExternalPages } from "@/src/lib/entities/game/ui/GameExternalPages";
import { GameLinksBlock } from "@/src/lib/entities/game/ui/GameLinksBlock";
import { IGameResponse } from "@mooncellar/schemas";
import {
  getGameExternalPages,
  getGameLinks,
} from "@/src/lib/shared/utils/links.utils";

interface IGameLinksPanelProps {
  game: IGameResponse;
  className?: string;
}

export const GameLinksPanel: FC<IGameLinksPanelProps> = ({
  game,
  className,
}) => {
  if (!getGameExternalPages(game).length && !getGameLinks(game).length) {
    return null;
  }

  return (
    <Box
      className={className}
      classNameContent={styles.links}
      contentStyle={{ padding: "var(--padding-x4)" }}
    >
      <GameExternalPages game={game} isBoxed={false} />
      <GameLinksBlock game={game} isBoxed={false} />
    </Box>
  );
};
