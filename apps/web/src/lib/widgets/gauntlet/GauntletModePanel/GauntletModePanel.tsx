"use client";

import { FC, useMemo } from "react";
import classNames from "classnames";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import { useRoyalGames } from "@/src/lib/entities/royal/model/useRoyalGames";
import { AppliedGameFilters } from "@/src/lib/features/filters/ui/Filters/AppliedGameFilters";
import { ModeCards } from "@/src/lib/features/wheel/ui/ModeCards";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useWheelStore } from "@/src/lib/shared/store/wheel.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import styles from "./GauntletModePanel.module.scss";

const formatCount = new Intl.NumberFormat("en-US").format;

const MODE_COPY = {
  gauntlet: {
    title: "Let the wheel pick from the catalogue",
    lede: "For the evening you want to play something but not decide what. Narrow the catalogue as far as you like, spin, and take what comes out. Every result lands in History.",
    steps: [
      ["Narrow it down", "Open Filters, or keep everything"],
      ["Spin", "The wheel draws from all matching games"],
      ["Keep it or spin again", "Winners stay in Lists, under History"],
    ],
  },
  royal: {
    title: "Knock out your own shortlist",
    lede: "The wheel holds only the games you crowned. Each spin knocks out the game it lands on; the last one standing wins. Filters are off here — the list is the filter.",
    steps: [
      ["Crown the candidates", "Press the crown on any game card"],
      ["Spin to knock one out", "The game it lands on leaves the wheel"],
      ["Last one wins", "The round restarts with the full list"],
    ],
  },
};

export const GauntletModePanel: FC = () => {
  const isRoyal = !!useStatesStore((state) => state.isRoyal);
  const matchTotal = useWheelStore((state) => state.matchTotal);
  const remainingIds = useWheelStore((state) => state.royalRemainingIds);
  const winner = useWheelStore((state) => state.winner);
  const { royalGames = [] } = useRoyalGames();
  const { data: royalGamesData = [] } = useGamesByIdsQuery(
    royalGames,
    undefined,
    royalGames.length > 0
  );

  const copy = isRoyal ? MODE_COPY.royal : MODE_COPY.gauntlet;

  const remaining = useMemo(
    () => new Set(remainingIds?.length ? remainingIds : royalGames),
    [remainingIds, royalGames]
  );

  const leftCount = royalGamesData.filter((game) =>
    remaining.has(game._id)
  ).length;

  return (
    <Box contentStyle={{ gap: "var(--gap-x3)" }}>
      <Breadcrumbs
        items={[
          { name: "Home", href: "/" },
          { name: "Gauntlet", href: "/gauntlet" },
        ]}
      />
      <div className={styles.panel}>
        <div className={styles.panel__modes}>
          <SectionTitle as="h1">Gauntlet</SectionTitle>
          <ModeCards
            gauntletCount={
              matchTotal !== undefined ? (
                <>
                  <b>{formatCount(matchTotal)}</b> games match
                </>
              ) : undefined
            }
            royalCount={
              royalGames.length ? (
                <>
                  <b>{isRoyal ? leftCount : royalGames.length}</b>
                  {isRoyal ? ` of ${royalGames.length} left` : " crowned"}
                </>
              ) : (
                "No crowned games yet"
              )
            }
          />
        </div>
        <div className={styles.panel__info}>
          <h2 className={styles.panel__title}>{copy.title}</h2>
          <p className={styles.panel__lede}>{copy.lede}</p>
          <ol
            className={classNames(styles.steps, {
              [styles.steps_royal]: isRoyal,
            })}
          >
            {copy.steps.map(([head, text]) => (
              <li key={head} className={styles.step}>
                <span>
                  <b>{head}</b>
                  {text}
                </span>
              </li>
            ))}
          </ol>
          {isRoyal ? (
            <div className={styles.applied}>
              <span className={styles.applied__label}>On the wheel</span>
              {!royalGamesData.length && (
                <span className={styles.applied__empty}>
                  Crown games on any page to fill the wheel.
                </span>
              )}
              {royalGamesData.map((game) => (
                <span
                  key={game._id}
                  className={classNames(styles.pill, {
                    [styles.pill_out]: !remaining.has(game._id),
                    [styles.pill_winner]: winner?._id === game._id,
                  })}
                >
                  {game.name}
                </span>
              ))}
            </div>
          ) : (
            <div className={styles.applied}>
              <span className={styles.applied__label}>Filters</span>
              <AppliedGameFilters className={styles.applied__filters} />
              <span className={styles.applied__empty}>
                {matchTotal !== undefined
                  ? `${formatCount(matchTotal)} games match`
                  : "Spinning over the whole catalogue"}
              </span>
            </div>
          )}
        </div>
      </div>
    </Box>
  );
};
