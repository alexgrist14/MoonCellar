"use client";

import { FC } from "react";
import classNames from "classnames";
import styles from "./GameStatsCounters.module.scss";
import { IGameStats } from "@mooncellar/schemas";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { useGameStatsQuery } from "@/src/lib/entities/game/api/game.queries";

interface IGameStatsCountersProps {
  gameId: string;
  initialStats?: IGameStats;
  className?: string;
}

const formatCount = new Intl.NumberFormat("en-US").format;

export const GameStatsCounters: FC<IGameStatsCountersProps> = ({
  gameId,
  initialStats,
  className,
}) => {
  const { data: stats } = useGameStatsQuery(gameId, initialStats);

  if (!stats) return null;

  const counters = [
    { key: "completed", label: "Beaten by", value: stats.completed },
    { key: "backlog", label: "In backlog", value: stats.backlog },
    { key: "playing", label: "Playing now", value: stats.playing },
    { key: "mastered", label: "Mastered", value: stats.mastered },
    { key: "wishlist", label: "In wishlist", value: stats.wishlist },
    { key: "dropped", label: "Dropped", value: stats.dropped },
  ];

  if (counters.every((counter) => !counter.value)) return null;

  return (
    <div className={classNames(styles.counters, className)}>
      {counters.map((counter) => (
        <StatTile
          key={counter.key}
          label={counter.label}
          value={formatCount(counter.value)}
          valueColor={`var(--game-${counter.key}-color)`}
        />
      ))}
    </div>
  );
};
