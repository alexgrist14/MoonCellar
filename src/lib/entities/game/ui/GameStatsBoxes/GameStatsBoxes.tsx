import { FC, useEffect, useMemo, useRef, useState } from "react";
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
  SvgClose,
  SvgEpicGames,
  SvgGog,
  SvgMore,
  SvgPlaystation,
  SvgSteam,
  SvgStore,
  SvgTwitch,
  SvgXbox,
  SvgYoutube,
} from "@/src/lib/shared/ui/svg";
import { ISvgBaseProps } from "@/src/lib/shared/ui/svg/Svg/Svg";
import { Button } from "@/src/lib/shared/ui/Button";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";
import classNames from "classnames";

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
  const storeBoxRef = useRef<HTMLDivElement>(null);
  const [isMore, setIsMore] = useState(false);
  const [isPagesActive, setIsPagesActive] = useState(false);
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

  useEffect(() => {
    const height = storeBoxRef.current?.scrollHeight;
    console.log(height);

    setIsMore(!!height && height > 40);
  }, [storeItems]);

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
      <div
        ref={storeBoxRef}
        className={classNames(
          styles.stats__stores,
          isPagesActive && styles.stats__stores_active
        )}
      >
        {storeItems
          .toSorted((a, b) =>
            !!a.name && !!b.name
              ? a.name === "Steam"
                ? -1
                : a.name.localeCompare(b.name)
              : 0
          )
          .map((store, i) => {
            const StoreIcon =
              (store.name && storeIcons[store.name]) || SvgStore;

            return (
              <Tooltip
                key={store.uid + i}
                content={
                  <div className={styles.stats__info}>
                    {store.name}
                    <br />
                    {store.url}
                  </div>
                }
              >
                <a
                  href={store.url!}
                  target="_blank"
                  rel="noreferrer"
                  className={styles.stats__store}
                >
                  <StoreIcon size="20" color="contrast" />
                </a>
              </Tooltip>
            );
          })}
      </div>
      {isMore && (
        <Button
          color="transparent"
          className={styles.stats__more}
          onClick={() => setIsPagesActive(!isPagesActive)}
        >
          {isPagesActive ? <SvgClose /> : <SvgMore />}
        </Button>
      )}
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
        <Box contentStyle={{ padding: "var(--padding-x3)" }}>{ratingBlock}</Box>
      )}
      {!!storesBlock && (
        <Box contentStyle={{ padding: "var(--padding-x3)" }}>{storesBlock}</Box>
      )}
    </>
  );
};
