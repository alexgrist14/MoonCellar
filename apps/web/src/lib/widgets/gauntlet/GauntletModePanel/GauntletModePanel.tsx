"use client";

import { FC, useMemo } from "react";
import classNames from "classnames";
import {
  useGamesByIdsQuery,
  useGamesQuery,
} from "@/src/lib/entities/game/api/game.queries";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
import { AppliedGameFilters } from "@/src/lib/features/filters/ui/Filters/AppliedGameFilters";
import { ModeCards } from "@/src/lib/features/wheel/ui/ModeCards";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useFiltersStore } from "@/src/lib/shared/store/filters.store";
import { useGamesStore } from "@/src/lib/shared/store/games.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { parseQueryFilters } from "@/src/lib/shared/utils/filters.utils";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Badge } from "@/src/lib/shared/ui/Badge";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import styles from "./GauntletModePanel.module.scss";

const formatCount = new Intl.NumberFormat("en-US").format;

export const GauntletModePanel: FC = () => {
  const isRoyal = !!useStatesStore((state) => state.isRoyal);
  const { asPath } = useAdvancedRouter();
  const isExcludeHistory = useFiltersStore((state) => state.isExcludeHistory);
  const historyGames = useGamesStore((state) => state.historyGames);
  const matchParams = useMemo(
    () => ({
      ...parseQueryFilters(asPath),
      take: 1,
      ...(isExcludeHistory &&
        !!historyGames?.length && {
          excludeGames: historyGames.map((game) => game._id),
        }),
    }),
    [asPath, isExcludeHistory, historyGames]
  );
  const { data: matches } = useGamesQuery(matchParams, !isRoyal);
  const matchTotal = matches?.total;
  const remainingIds = useWheelStore((state) => state.royalRemainingIds);
  const winner = useWheelStore((state) => state.winner);
  const { royalGames = [] } = useRoyalGames();
  const { data: royalGamesData = [] } = useGamesByIdsQuery(
    royalGames,
    undefined,
    royalGames.length > 0
  );

  const remaining = useMemo(
    () => new Set(remainingIds?.length ? remainingIds : royalGames),
    [remainingIds, royalGames]
  );

  return (
    <Box contentStyle={{ gap: "var(--gap-x2)" }}>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Gauntlet", href: "/gauntlet" },
        ]}
      />
      <div className={styles.bar}>
        <SectionTitle as="h1">Gauntlet</SectionTitle>
        <ModeCards />
        {isRoyal ? (
          <div className={styles.applied}>
            <span className={styles.applied__label}>On the wheel</span>
            {!royalGamesData.length && (
              <span className={styles.applied__empty}>
                Crown games on any page to fill the wheel.
              </span>
            )}
            {royalGamesData.map((game) => (
              <Badge
                key={game._id}
                isWrap
                tone={
                  winner?._id === game._id
                    ? "attention"
                    : !remaining.has(game._id)
                      ? "muted"
                      : "neutral"
                }
                isStruck={!remaining.has(game._id) && winner?._id !== game._id}
              >
                {game.name}
              </Badge>
            ))}
          </div>
        ) : (
          <div className={classNames(styles.applied, styles.applied_line)}>
            <span className={styles.applied__label}>Filters</span>
            <AppliedGameFilters
              className={styles.applied__filters}
              isSingleLine
              summary={
                <span className={styles.applied__empty}>
                  {matchTotal !== undefined
                    ? `${formatCount(matchTotal)} games match`
                    : "Counting games…"}
                </span>
              }
            />
          </div>
        )}
      </div>
    </Box>
  );
};
