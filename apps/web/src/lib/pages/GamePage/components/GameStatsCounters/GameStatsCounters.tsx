"use client";

import { FC } from "react";
import classNames from "classnames";
import styles from "./GameStatsCounters.module.scss";
import { IGameStats } from "@mooncellar/schemas";
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

  if (!stats?.players) return null;

  const counters = [
    { key: "completed", label: "Beaten by", value: stats.completed },
    { key: "backlog", label: "In backlog", value: stats.backlog },
    { key: "playing", label: "Playing now", value: stats.playing },
    { key: "mastered", label: "Mastered", value: stats.mastered },
  ];

  return (
    <div className={classNames(styles.counters, className)}>
      {counters.map((counter) => (
        <div
          key={counter.key}
          className={classNames(
            styles.counters__item,
            styles[`counters__item_${counter.key}`]
          )}
        >
          <p className={styles.counters__label}>{counter.label}</p>
          <p className={styles.counters__value}>{formatCount(counter.value)}</p>
        </div>
      ))}
    </div>
  );
};
