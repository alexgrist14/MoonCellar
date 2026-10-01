import { ILogPlaythrough, ILogPlaythroughState } from "@mooncellar/schemas";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";

const DAY_MS = 24 * 60 * 60 * 1000;

export const EMPTY_VALUE = "—";

const getStatusKey = (state?: ILogPlaythroughState) =>
  state?.isMastered ? "mastered" : state?.category;

export const getStatusLabel = (state?: ILogPlaythroughState) => {
  const key = getStatusKey(state);

  return key ? commonUtils.upFL(key) : undefined;
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

const formatClock = (date: Date) =>
  date.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const getTimeLabel = (date: Date, now: Date) => {
  const offset = getDayOffset(date, now);

  if (offset === 0) return commonUtils.getHumanDate(date);
  if (offset === 1) return `Yesterday, ${formatClock(date)}`;

  const day = date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(date.getFullYear() !== now.getFullYear() ? { year: "numeric" } : {}),
  });

  return `${day}, ${formatClock(date)}`;
};
