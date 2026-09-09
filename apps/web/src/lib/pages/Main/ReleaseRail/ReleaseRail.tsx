"use client";

import { FC } from "react";
import styles from "./ReleaseRail.module.scss";
import { IGameResponse } from "../../../shared/lib/schemas/games.schema";
import { GameCard } from "../../../shared/ui/GameCard";
import { Scrollbar } from "../../../shared/ui/Scrollbar";

const formatReleaseDate = (game: IGameResponse): string | null => {
  if (game.release_dates?.length) {
    const matching = game.first_release
      ? game.release_dates.find((d) => d.date === game.first_release)
      : undefined;

    if (matching?.human) return matching.human;

    const soonest = [...game.release_dates].sort((a, b) => a.date - b.date)[0];
    if (soonest?.human) return soonest.human;
  }

  if (game.first_release) {
    return new Date(game.first_release * 1000).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  return null;
};

interface ReleaseRailProps {
  games: IGameResponse[];
  withDate?: boolean;
}

export const ReleaseRail: FC<ReleaseRailProps> = ({ games, withDate }) => {
  if (!games?.length) return null;

  return (
    <Scrollbar classNameContent={styles.rail} isHorizontal>
      {games.map((game) => {
        const date = withDate ? formatReleaseDate(game) : null;

        return (
          <div className={styles.rail__item} key={game._id}>
            <GameCard game={game} />
            {!!date && <span className={styles.rail__date}>{date}</span>}
          </div>
        );
      })}
    </Scrollbar>
  );
};
