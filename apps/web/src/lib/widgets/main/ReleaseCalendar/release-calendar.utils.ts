import { IGameResponse, IUpcomingReleaseGroup } from "@mooncellar/schemas";
import {
  formatReleaseDate,
  isExactReleaseDay,
} from "@/src/lib/entities/game/model";
import { getMoonPhase, getMoonPhaseName } from "@/src/lib/shared/utils/moon.utils";

const DAY_MS = 86_400_000;
const AVERAGE_MONTH_DAYS = 30.44;

const relativeTime = new Intl.RelativeTimeFormat("en", { numeric: "auto" });

interface ICalendarStopBase {
  key: string;
  month?: string;
  title: string;
  caption: string;
}

export interface ICalendarNight extends ICalendarStopBase {
  kind: "night";
  dateTime: string;
  weekday?: string;
  phase: number;
  isTonight: boolean;
  games: IGameResponse[];
}

export interface ICalendarUndated extends ICalendarStopBase {
  kind: "undated";
  games: { game: IGameResponse; release: string | null }[];
}

export type ICalendarStop = ICalendarNight | ICalendarUndated;

const startOfUtcDay = (ms: number) => Math.floor(ms / DAY_MS) * DAY_MS;

const formatUtc = (ms: number, options: Intl.DateTimeFormatOptions) =>
  new Date(ms).toLocaleDateString("en-US", { ...options, timeZone: "UTC" });

export const formatCountdown = (days: number): string => {
  if (days < 14) return relativeTime.format(days, "day");
  if (days < 60) return relativeTime.format(Math.round(days / 7), "week");

  return relativeTime.format(Math.round(days / AVERAGE_MONTH_DAYS), "month");
};

const createNight = (
  dayMs: number,
  todayMs: number,
  games: IGameResponse[]
): ICalendarNight => {
  const phase = getMoonPhase(dayMs + DAY_MS / 2);
  const isTonight = dayMs === todayMs;

  return {
    kind: "night",
    key: String(dayMs),
    dateTime: new Date(dayMs).toISOString().slice(0, 10),
    title: isTonight ? "Tonight" : formatUtc(dayMs, { day: "numeric" }),
    weekday: isTonight ? undefined : formatUtc(dayMs, { weekday: "short" }),
    caption: isTonight
      ? getMoonPhaseName(phase)
      : formatCountdown(Math.round((dayMs - todayMs) / DAY_MS)),
    phase,
    isTonight,
    games,
  };
};

export const buildReleaseCalendar = (
  groups: IUpcomingReleaseGroup[],
  nowMs: number
): ICalendarStop[] => {
  const todayMs = startOfUtcDay(nowMs);
  const tonightGames: IGameResponse[] = [];
  const stops: ICalendarStop[] = [];

  for (const group of groups) {
    const nights = new Map<number, IGameResponse[]>();
    const undated: ICalendarUndated["games"] = [];

    for (const game of group.games) {
      const release = formatReleaseDate(game);

      if (!game.first_release || !isExactReleaseDay(release)) {
        undated.push({ game, release });
        continue;
      }

      const dayMs = Math.max(
        startOfUtcDay(game.first_release * 1000),
        todayMs
      );

      if (dayMs === todayMs) {
        tonightGames.push(game);
        continue;
      }

      nights.set(dayMs, [...(nights.get(dayMs) ?? []), game]);
    }

    [...nights]
      .sort(([a], [b]) => a - b)
      .forEach(([dayMs, games]) =>
        stops.push(createNight(dayMs, todayMs, games))
      );

    if (undated.length) {
      stops.push({
        kind: "undated",
        key: `undated-${group.year}-${group.quarter}`,
        title: group.label,
        caption: "No date yet",
        games: undated,
      });
    }
  }

  const calendar = [createNight(todayMs, todayMs, tonightGames), ...stops];
  const thisYear = new Date(todayMs).getUTCFullYear();
  let previousMonth = "";

  for (const stop of calendar) {
    if (stop.kind !== "night") continue;

    const dayMs = Date.parse(stop.dateTime);
    const isOtherYear = new Date(dayMs).getUTCFullYear() !== thisYear;
    const month = formatUtc(dayMs, {
      month: "long",
      year: isOtherYear ? "numeric" : undefined,
    });

    if (month !== previousMonth) stop.month = month;
    previousMonth = month;
  }

  return calendar;
};
