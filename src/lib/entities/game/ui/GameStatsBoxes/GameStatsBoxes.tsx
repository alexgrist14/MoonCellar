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
import {
  SvgAmazon,
  SvgEpicGames,
  SvgGog,
  SvgPlaystation,
  SvgSteam,
  SvgStore,
  SvgTwitch,
  SvgXbox,
  SvgYoutube,
} from "@/src/lib/shared/ui/svg";
import { ISvgBaseProps } from "@/src/lib/shared/ui/svg/Svg/Svg";

const storeIcons: Record<string, FC<ISvgBaseProps>> = {
  Steam: SvgSteam,
  GOG: SvgGog,
  "Epic Games": SvgEpicGames,
  "PlayStation Store": SvgPlaystation,
  YouTube: SvgYoutube,
  Twitch: SvgTwitch,
  Amazon: SvgAmazon,
  Xbox: SvgXbox,
};

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

  const storeItems = useMemo(() => {
    const items = (game.externalPages || []).filter((store) => !!store.url);

    return items.length ? items : null;
  }, [game.externalPages]);

  if (!hltbRows && !ratingRows && !storeItems) return null;

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

  const storesBlock = !!storeItems && (
    <div className={styles.stats}>
      <h4>External pages:</h4>
      <div className={styles.stats__stores}>
        {storeItems.map((store, i) => {
          const StoreIcon = (store.name && storeIcons[store.name]) || SvgStore;

          return (
            <a
              key={store.uid + i}
              href={store.url!}
              target="_blank"
              rel="noreferrer"
              className={styles.stats__store}
            >
              <StoreIcon size="20" />
              <span>{store.name || store.url}</span>
            </a>
          );
        })}
      </div>
    </div>
  );

  if (!isBoxed) {
    return (
      <>
        {hltbBlock}
        {ratingBlock}
        {storesBlock}
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
      {!!storesBlock && (
        <Box contentStyle={{ padding: "var(--padding-x3)" }}>
          {storesBlock}
        </Box>
      )}
    </>
  );
};
