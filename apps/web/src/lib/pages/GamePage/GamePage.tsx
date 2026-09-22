"use client";

import { FC } from "react";
import styles from "./GamePage.module.scss";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import {
  IGameResponse,
  IGameStats,
  IReviewsResponse,
} from "@mooncellar/schemas";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { GameAdminControls } from "@/src/lib/features/game/ui/GameAdminControls";
import { GameHero } from "@/src/lib/widgets/game/GameHero";
import { GameOverview } from "@/src/lib/entities/game/ui/GameOverview";
import { GameScoreColumn } from "@/src/lib/widgets/game/GameScoreColumn";
import { GameSideColumn } from "@/src/lib/widgets/game/GameSideColumn";
import { GameMedia } from "@/src/lib/entities/game/ui/GameMedia";
import { GameDetails } from "@/src/lib/entities/game/ui/GameDetails";
import { GameReleaseDates } from "@/src/lib/entities/game/ui/GameReleaseDates";
import { GameMultiplayer } from "@/src/lib/entities/game/ui/GameMultiplayer";
import { GameCommunity } from "@/src/lib/features/game/ui/GameCommunity";

interface IGamePageProps {
  game: IGameResponse;
  stats?: IGameStats;
  reviews?: IReviewsResponse;
}

export const GamePage: FC<IGamePageProps> = ({ game, stats, reviews }) => {
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
      <GameCommunity game={game} initialReviews={reviews} />
      <div className={styles.page__columns}>
        <GameReleaseDates game={game} className={styles.page__column} />
        <GameMultiplayer game={game} className={styles.page__column} />
      </div>
      <GameAdminControls game={game} />
    </div>
  );
};
