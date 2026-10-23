"use client";

import { FC } from "react";
import Link from "next/link";
import { IGameResponse, IGameStats } from "@mooncellar/schemas";
import { GameCoverImage } from "@/src/lib/entities/game/ui/GameCoverImage";
import { GameStatsBar } from "@/src/lib/entities/game/ui/GameStatsBar";
import { GameControls } from "@/src/lib/widgets/game/GameControls";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button } from "@/src/lib/shared/ui/Button";
import { Chip } from "@/src/lib/shared/ui/Chip";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { ScoreValue } from "@/src/lib/shared/ui/ScoreValue";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { getAverageRating } from "@/src/lib/shared/utils/rating.utils";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";
import styles from "./ArticleGamePanel.module.scss";

interface IArticleGamePanelProps {
  game: IGameResponse;
  stats?: IGameStats;
}

const formatCount = new Intl.NumberFormat("en-US").format;

export const ArticleGamePanel: FC<IArticleGamePanelProps> = ({
  game,
  stats,
}) => {
  const isCoverHidden = useHideAdult() && isAdultGame(game);
  const rating = getAverageRating(game);
  const href = `/games/${game.slug}`;
  const year = game.first_release
    ? new Date(game.first_release * 1000).getUTCFullYear()
    : null;
  const developer = game.companies?.find((company) => company.developer)?.name;

  return (
    <Box
      contentStyle={{
        gap: "var(--gap-x4)",
        padding: "var(--padding-x4)",
      }}
    >
      <p className={styles.label}>The game in this article</p>
      <div className={styles.game}>
        <Link href={href} className={styles.game__cover} tabIndex={-1}>
          {isCoverHidden ? (
            <Cover isWithoutText className={styles.game__placeholder} />
          ) : (
            <GameCoverImage game={game} sizes="92px" />
          )}
        </Link>
        <div className={styles.game__info}>
          <Link href={href} className={styles.game__name}>
            {game.name}
          </Link>
          {(!!year || !!developer) && (
            <span className={styles.game__sub}>
              {[year, developer].filter(Boolean).join(" · ")}
            </span>
          )}
          {!!game.genres?.length && (
            <div className={styles.game__genres}>
              {game.genres.map((genre) => (
                <Chip key={genre} href={`/games/genre/${toSlug(genre)}`}>
                  {genre}
                </Chip>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className={styles.stats}>
        {rating !== null && (
          <div className={styles.stats__score}>
            <ScoreValue value={rating} />
            {!!game.ratingsCount && (
              <span>{formatCount(game.ratingsCount)} ratings</span>
            )}
          </div>
        )}
        <GameStatsBar gameId={game._id} initialStats={stats} />
      </div>
      <div className={styles.actions}>
        <GameControls game={game} />
        <Button href={href}>Open game page</Button>
      </div>
    </Box>
  );
};
