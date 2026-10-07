"use client";

import { FC, useMemo } from "react";
import { IUpcomingReleaseGroup } from "@mooncellar/schemas";
import { GameCard } from "@/src/lib/widgets/game/GameCard";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import { MoonPhase } from "@/src/lib/shared/ui/MoonPhase";
import { buildReleaseCalendar } from "./release-calendar.utils";
import styles from "./ReleaseCalendar.module.scss";

interface IReleaseCalendarProps {
  groups: IUpcomingReleaseGroup[];
  now: number;
}

export const ReleaseCalendar: FC<IReleaseCalendarProps> = ({ groups, now }) => {
  const stops = useMemo(() => buildReleaseCalendar(groups, now), [groups, now]);

  return (
    <Scrollbar isHorizontal isWithArrows>
      <ol className={styles.calendar} aria-label="Release calendar">
        {stops.map((stop) => {
          const isNight = stop.kind === "night";
          const heading = (
            <>
              <span className={styles.stop__title}>{stop.title}</span>
              {isNight && !!stop.weekday && (
                <span className={styles.stop__weekday}>{stop.weekday}</span>
              )}
            </>
          );

          return (
            <li key={stop.key} className={styles.stop}>
              <span className={styles.stop__month}>{stop.month}</span>
              <MoonPhase
                className={styles.stop__node}
                phase={isNight ? stop.phase : undefined}
                size="28"
                isHighlighted={isNight && stop.isTonight}
              />
              {isNight ? (
                <time className={styles.stop__date} dateTime={stop.dateTime}>
                  {heading}
                </time>
              ) : (
                <span className={styles.stop__date}>{heading}</span>
              )}
              <span className={styles.stop__caption}>{stop.caption}</span>
              {!!stop.games.length && (
                <div className={styles.stop__games}>
                  {isNight
                    ? stop.games.map((game) => (
                        <div className={styles.stop__game} key={game._id}>
                          <GameCard game={game} />
                        </div>
                      ))
                    : stop.games.map(({ game, release }) => (
                        <div className={styles.stop__game} key={game._id}>
                          <GameCard game={game} />
                          {!!release && release !== stop.title && (
                            <span className={styles.stop__release}>
                              {release}
                            </span>
                          )}
                        </div>
                      ))}
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </Scrollbar>
  );
};
