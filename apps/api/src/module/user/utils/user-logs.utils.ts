import type {
  ILogChanges,
  ILogPlaythrough,
  ILogPlaythroughState,
  ILogRating,
} from "@mooncellar/schemas";

export const LOG_FIELDS = ["playthrough", "rating", "favorite"] as const;

export function compact<T extends object>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, v]) => v !== undefined)
  ) as T;
}

function canonical(value: unknown): string {
  return JSON.stringify(value, (_key, v) =>
    v && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v)
            .filter(([, entry]) => entry !== undefined)
            .sort(([a], [b]) => a.localeCompare(b))
        )
      : v
  );
}

export const isSameLogValue = (a: unknown, b: unknown) =>
  canonical(a ?? null) === canonical(b ?? null);

function mergePlaythrough(
  current: ILogPlaythrough | undefined,
  next: ILogPlaythrough
): ILogPlaythrough | undefined {
  const existedBefore = (current ?? next).action !== "added";
  const existsAfter = next.action !== "removed";

  if (!existedBefore && !existsAfter) return undefined;

  const before: ILogPlaythroughState | undefined = existsAfter
    ? current
      ? current.before
      : next.before
    : (next.before ?? current?.before);

  if (existedBefore && existsAfter && before && next.after) {
    if (isSameLogValue(before, next.after)) return undefined;
  }

  return compact({
    playthroughId: next.playthroughId ?? current?.playthroughId,
    action: !existedBefore ? "added" : existsAfter ? "updated" : "removed",
    before: existedBefore ? before : undefined,
    after: existsAfter ? next.after : undefined,
  });
}

function mergeRating(
  current: ILogRating | undefined,
  next: ILogRating
): ILogRating | undefined {
  const previous = current ? current.previous : next.previous;

  if (previous !== undefined && previous === next.value) return undefined;

  return compact({ value: next.value, previous });
}

function mergeFavorite(current: boolean | undefined, next: boolean) {
  return current === !next ? undefined : next;
}

export function mergeLogChanges(
  current: ILogChanges,
  next: ILogChanges
): ILogChanges {
  return compact({
    playthrough: next.playthrough
      ? mergePlaythrough(current.playthrough, next.playthrough)
      : current.playthrough,
    rating: next.rating
      ? mergeRating(current.rating, next.rating)
      : current.rating,
    favorite:
      next.favorite === undefined
        ? current.favorite
        : mergeFavorite(current.favorite, next.favorite),
  });
}

export const isEmptyLog = (changes: ILogChanges) =>
  LOG_FIELDS.every((field) => changes[field] === undefined);

export const pickLogChanges = (log: ILogChanges): ILogChanges =>
  compact({
    playthrough: log.playthrough ?? undefined,
    rating: log.rating ?? undefined,
    favorite: log.favorite ?? undefined,
  });

export const canMergeLog = (current: ILogChanges, next: ILogChanges) =>
  !current.playthrough ||
  !next.playthrough ||
  current.playthrough.playthroughId === next.playthrough.playthroughId;

export function toLogUpdate(changes: ILogChanges) {
  const $set: Record<string, unknown> = {};
  const $unset: Record<string, ""> = {};

  LOG_FIELDS.forEach((field) => {
    if (changes[field] === undefined) $unset[field] = "";
    else $set[field] = changes[field];
  });

  return { $set, $unset };
}
