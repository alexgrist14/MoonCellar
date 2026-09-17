import { ILogSegment } from "@mooncellar/schemas";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";

export type IActivityTone =
  | "completed"
  | "playing"
  | "mastered"
  | "played"
  | "wishlist"
  | "backlog"
  | "dropped"
  | "favorite"
  | "accent"
  | "removed";

const CATEGORY_TONES: IActivityTone[] = [
  "completed",
  "playing",
  "mastered",
  "played",
  "wishlist",
  "backlog",
  "dropped",
];

const DAY_MS = 24 * 60 * 60 * 1000;

export const EMPTY_VALUE = "—";

export const toCategoryTone = (status?: string) => {
  const key = status?.trim().toLowerCase();

  return CATEGORY_TONES.find((tone) => tone === key);
};

export const getSegmentTone = (segment: ILogSegment): IActivityTone => {
  if (segment.isRemoval) return "removed";

  if (segment.kind === "added" || segment.kind === "updated") {
    return toCategoryTone(segment.status) ?? "accent";
  }

  if (segment.kind === "favorite") return "favorite";

  return "accent";
};

export const formatHours = (time?: string) => {
  if (!time) return undefined;
  if (time === EMPTY_VALUE) return EMPTY_VALUE;

  return `${time.replace(/\s*h$/i, "")} h`;
};

const startOfDay = (date: Date) =>
  new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

export const getDayOffset = (date: Date, now: Date) =>
  Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);

export const getDayLabel = (date: Date, now: Date) => {
  const offset = getDayOffset(date, now);

  if (offset === 0) return "Today";
  if (offset === 1) return "Yesterday";

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });
};

export const getTimeLabel = (date: Date, now: Date) =>
  getDayOffset(date, now) === 0
    ? commonUtils.getHumanDate(date)
    : date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
