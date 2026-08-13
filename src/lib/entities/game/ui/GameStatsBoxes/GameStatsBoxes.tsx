import { FC, useMemo } from "react";
import styles from "./GameStatsBoxes.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { RatingStars } from "@/src/lib/shared/ui/RatingStars";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";
import { formatHltbHours } from "@/src/lib/shared/utils/hltb.utils";
import {
  formatRating,
  normalizeRating,
} from "@/src/lib/shared/utils/rating.utils";

interface IGameStatsBoxesProps {
  game: IGameResponse;
  isBoxed?: boolean;
}

export const GameStatsBoxes: FC<IGameStatsBoxesProps> = ({
  game,
  isBoxed = true,
}) => {
  const hltbRows = useMemo(() => {
    if (!game.hltb) {
      return null;
    }

    const rows = [
      { label: "Main Story", value: formatHltbHours(game.hltb.mainStory) },
      { label: "Main + Extra", value: formatHltbHours(game.hltb.mainExtra) },
      {
        label: "Completionist",
        value: formatHltbHours(game.hltb.completionist),
      },
    ].filter((row) => row.value);

    return rows.length ? rows : null;
  }, [game.hltb]);

  const ratingRows = useMemo(() => {
    const rows = [
      {
        label: "Users",
        value: formatRating(game.averageRating),
        rating: normalizeRating(game.averageRating),
      },
      {
        label: "IGDB",
        value: formatRating(game.igdb?.total_rating, 100),
        rating: normalizeRating(game.igdb?.total_rating, 100),
      },
      {
        label: "HowLongToBeat",
        value: formatRating(game.hltb?.reviewScore, 100),
        rating: normalizeRating(game.hltb?.reviewScore, 100),
      },
    ].filter((row) => row.value);

    return rows.length ? rows : null;
  }, [game.averageRating, game.igdb, game.hltb]);

  if (!hltbRows && !ratingRows) return null;

  const hltbBlock = !!hltbRows && (
    <div className={styles.stats}>
      <h4>HowLongToBeat:</h4>
      {hltbRows.map((row) => (
        <p key={row.label}>
          <span>{row.label}: </span>
          {row.value}
        </p>
      ))}
    </div>
  );

  const ratingBlock = !!ratingRows && (
    <div className={styles.stats}>
      <h4>Ratings:</h4>
      {ratingRows.map((row) => (
        <div key={row.label} className={styles.stats__rating}>
          <p>
            <span>{row.label}: </span>
            {row.value}
          </p>
          {row.rating != null && <RatingStars rating={row.rating} />}
        </div>
      ))}
    </div>
  );

  if (!isBoxed) {
    return (
      <>
        {hltbBlock}
        {ratingBlock}
      </>
    );
  }

  return (
    <>
      {!!hltbBlock && (
        <Box contentStyle={{ padding: "var(--padding-x3)" }}>{hltbBlock}</Box>
      )}
      {!!ratingBlock && (
        <Box contentStyle={{ padding: "var(--padding-x3)" }}>
          {ratingBlock}
        </Box>
      )}
    </>
  );
};
