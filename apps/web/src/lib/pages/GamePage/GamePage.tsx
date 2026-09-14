"use client";

import { FC } from "react";
import styles from "./GamePage.module.scss";
import { BGImage } from "../../shared/ui/BGImage";
import { IGameResponse, IGameStats } from "@mooncellar/schemas";
import { useHideAdult } from "../../shared/hooks/useHideAdult";
import { isAdultGame } from "../../shared/utils/adult.utils";
import { GameAdminControls } from "../../features/game/GameAdminControls";
import { GameHero } from "./components/GameHero";
import { GameOverview } from "./components/GameOverview";
import { GameScoreColumn } from "./components/GameScoreColumn";
import { GameSideColumn } from "./components/GameSideColumn";
import { GameMedia } from "../../entities/game/ui/GameMedia";
import { GameDetails } from "./components/GameDetails";
import { GameReleaseDates } from "./components/GameReleaseDates";
import { GameMultiplayer } from "./components/GameMultiplayer";

export const GamePage: FC<{ game: IGameResponse; stats?: IGameStats }> = ({
  game,
  stats,
}) => {
  const hideMedia = useHideAdult() && isAdultGame(game);

  if (!game) return null;

  return (
    <div className={styles.page}>
      <BGImage game={game} />
      <GameHero game={game} stats={stats} />
      <div className={styles.page__columns}>
        <GameOverview game={game} className={styles.page__columnWide} />
        <GameScoreColumn game={game} className={styles.page__column} />
        <GameSideColumn game={game} className={styles.page__column} />
      </div>
      {!hideMedia && <GameMedia game={game} />}
      <GameDetails game={game} />
      <div className={styles.page__columns}>
        <GameReleaseDates game={game} className={styles.page__column} />
        <GameMultiplayer game={game} className={styles.page__column} />
      </div>
      <GameAdminControls game={game} />
    </div>
  );
};
