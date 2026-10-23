"use client";

import { FC } from "react";
import { IGameStats } from "@mooncellar/schemas";
import { useGameStatsQuery } from "@/src/lib/entities/game/api/game.queries";
import styles from "./GameStatsBar.module.scss";

interface IGameStatsBarProps {
  gameId: string;
  initialStats?: IGameStats;
}

const STATUSES = [
  "completed",
  "mastered",
  "playing",
  "played",
  "backlog",
  "wishlist",
  "dropped",
] as const;

const formatCount = new Intl.NumberFormat("en-US").format;

export const GameStatsBar: FC<IGameStatsBarProps> = ({
  gameId,
  initialStats,
}) => {
  const { data: stats } = useGameStatsQuery(gameId, initialStats);
  const parts = STATUSES.map((status) => ({
    status,
    value: stats?.[status] ?? 0,
  })).filter((part) => part.value > 0);

  if (!parts.length) return null;

  const total = parts.reduce((sum, part) => sum + part.value, 0);

  return (
    <div className={styles.stats}>
      <div
        className={styles.stats__bar}
        role="img"
        aria-label={parts
          .map((part) => `${formatCount(part.value)} ${part.status}`)
          .join(", ")}
      >
        {parts.map((part) => (
          <span
            key={part.status}
            style={{
              flexGrow: part.value / total,
              backgroundColor: `var(--game-${part.status}-color)`,
            }}
          />
        ))}
      </div>
      <ul className={styles.stats__legend} aria-hidden="true">
        {parts.map((part) => (
          <li
            key={part.status}
            style={{ color: `var(--game-${part.status}-color)` }}
          >
            <span>
              {formatCount(part.value)} {part.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};
