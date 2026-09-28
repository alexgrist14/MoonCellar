import {
  ILogChanges,
  ILogPlaythrough,
  ILogPlaythroughState,
} from "@mooncellar/schemas";
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

const STATUS_PHRASES: Record<string, [string, string?]> = {
  completed: ["Completed"],
  mastered: ["Mastered"],
  played: ["Played"],
  dropped: ["Dropped"],
  playing: ["Started playing"],
  backlog: ["Added", "to the backlog"],
  wishlist: ["Wishlisted"],
};

const getStatusKey = (state?: ILogPlaythroughState) =>
  state?.isMastered ? "mastered" : state?.category;

export const getStatusPhrase = (
  state?: ILogPlaythroughState
): [string, string?] | undefined => {
  if (state?.isMastered && state.category === "completed") {
    return ["Completed and mastered"];
  }

  const key = getStatusKey(state);

  return key ? STATUS_PHRASES[key] : undefined;
};

export const isStatusChanged = (
  before?: ILogPlaythroughState,
  after?: ILogPlaythroughState
) =>
  !!getStatusKey(after) &&
  (before?.category !== after?.category ||
    !!before?.isMastered !== !!after?.isMastered);

export const isReviewAdded = ({ action, before, after }: ILogPlaythrough) =>
  action !== "removed" && !!after?.hasReview && !before?.hasReview;

export const getLogTone = ({
  playthrough,
  rating,
  favorite,
}: ILogChanges): IActivityTone => {
  if (playthrough) {
    if (playthrough.action === "removed") return "removed";

    return toCategoryTone(getStatusKey(playthrough.after)) ?? "accent";
  }

  if (rating) return rating.value === null ? "removed" : "accent";
  if (favorite !== undefined) return favorite ? "favorite" : "removed";

  return "accent";
};

const DETAIL_FIELDS: {
  label: string;
  format: (state?: ILogPlaythroughState) => string | undefined;
}[] = [
  { label: "Platform", format: (state) => state?.platform },
  {
    label: "Time",
    format: (state) =>
      state?.time === undefined ? undefined : `${state.time} h`,
  },
  {
    label: "Date",
    format: (state) => state?.date?.split("-").reverse().join("."),
  },
];

export const getPlaythroughDetails = ({
  action,
  before,
  after,
}: ILogPlaythrough) => {
  if (action !== "updated" || !before || isStatusChanged(before, after)) {
    return DETAIL_FIELDS.map(({ format }) => format(after ?? before));
  }

  return DETAIL_FIELDS.map(({ label, format }) => {
    const value = format(after);

    if (value === format(before)) return undefined;

    return value ?? `${label} ${EMPTY_VALUE}`;
  });
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
