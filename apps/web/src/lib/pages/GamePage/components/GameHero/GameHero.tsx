"use client";

import { FC, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./GameHero.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { GameRating } from "@/src/lib/features/game/GameRating";
import { SvgCrown } from "@/src/lib/shared/ui/svg/SvgCrown";
import { IGameResponse, IGameStats } from "@mooncellar/schemas";
import { GameStatsCounters } from "../GameStatsCounters";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useHideAdult } from "@/src/lib/shared/hooks/useHideAdult";
import { isAdultGame } from "@/src/lib/shared/utils/adult.utils";
import { toSlug } from "@/src/lib/shared/utils/slug.utils";

interface IGameHeroProps {
  game: IGameResponse;
  stats?: IGameStats;
}

export const GameHero: FC<IGameHeroProps> = ({ game, stats }) => {
  const systems = useCommonStore((s) => s.systems);
  const royalGames = useGamesStore((s) => s.royalGames);
  const hideMedia = useHideAdult() && isAdultGame(game);

  const artwork = hideMedia
    ? undefined
    : (game.artworks?.[0] ?? game.screenshots?.[0]);

  const releaseYear = game.first_release
    ? new Date(game.first_release * 1000).getFullYear()
    : undefined;

  const isRoyal = !!royalGames?.includes(game._id);

  const chips = useMemo(() => {
    const items: { key: string; label: string; href: string }[] = [];

    if (releaseYear) {
      items.push({
        key: `year-${releaseYear}`,
        label: String(releaseYear),
        href: `/games?years[]=${releaseYear}&years[]=${releaseYear}`,
      });
    }

    if (game.type) {
      items.push({
        key: `type-${game.type}`,
        label: game.type,
        href: `/games?selectedGameTypes[]=${game.type}`,
      });
    }

    if (game.status) {
      items.push({
        key: `status-${game.status}`,
        label: game.status,
        href: `/games?selectedStatus[]=${game.status}`,
      });
    }

    game.genres?.forEach((genre) =>
      items.push({
        key: `genre-${genre}`,
        label: genre,
        href: `/games/genre/${toSlug(genre)}`,
      })
    );

    game.player_perspectives?.forEach((perspective) =>
      items.push({
        key: `perspective-${perspective}`,
        label: perspective,
        href: `/games?selectedPlayerPerspectives[]=${perspective}`,
      })
    );

    game.platformIds?.forEach((id) => {
      const platform = systems?.find((sys) => sys._id === id);

      if (!platform) return;

      items.push({
        key: `platform-${id}`,
        label: platform.name,
        href: `/games/platform/${platform.slug}`,
      });
    });

    return items;
  }, [game, releaseYear, systems]);

  return (
    <Box
      className={styles.hero}
      templateStyle={{
        overflow: "hidden",
        background: "var(--color-bg-secondary)",
      }}
      contentStyle={{ padding: 0, gap: 0 }}
    >
      <div className={styles.hero__banner}>
        {!!artwork && (
          <Image
            src={artwork}
            alt={`${game.name} artwork`}
            fill
            priority
            sizes="100vw"
            className={styles.hero__artwork}
          />
        )}
        <div className={styles.hero__scrim} />
        <Breadcrumbs
          className={styles.hero__crumbs}
          items={[
            { name: "Games", href: "/games" },
            ...(game.genres?.length
              ? [
                  {
                    name: game.genres[0],
                    href: `/games/genre/${toSlug(game.genres[0])}`,
                  },
                ]
              : []),
            { name: game.name, href: `/games/${game.slug}` },
          ]}
        />
        {isRoyal && (
          <span className={styles.hero__royal}>
            <SvgCrown size="16" />
            In royal games
          </span>
        )}
      </div>

      <div className={styles.hero__body}>
        <div className={styles.hero__cover}>
          <GameCard game={game} isInfoDisabled />
        </div>

        <div className={styles.hero__main}>
          <div className={styles.hero__title}>
            <h1>{game.name}</h1>
            {!!game.alternative_names?.length && (
              <p className={styles.hero__altNames}>
                {game.alternative_names.join(", ")}
              </p>
            )}
          </div>

          {!!chips.length && (
            <div className={styles.hero__chips}>
              {chips.map((chip) => (
                <Link
                  key={chip.key}
                  href={chip.href}
                  className={styles.hero__chip}
                >
                  {chip.label}
                </Link>
              ))}
            </div>
          )}

          <GameRating game={game} className={styles.hero__ratingControl} />
        </div>

        <GameStatsCounters
          gameId={game._id}
          initialStats={stats}
          className={styles.hero__counters}
        />
      </div>
    </Box>
  );
};
