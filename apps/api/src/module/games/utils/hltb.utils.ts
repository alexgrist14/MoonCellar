import {
  type IAddGameRequest,
  type IHltbField,
  type IMatchReason,
  type IRelatedGamesField,
  type IScoreBreakdown,
} from "@mooncellar/schemas";
import type {
  IScoredCandidate,
  TMatchCandidate,
} from "../matching/game-matcher.types";
import { decodeHtml } from "../../../shared/utils";
import { parsePartialDate, toReleaseDate } from "../../../shared/release-date";
import { getMatchScore, type HowLongToBeatResultEntry } from "howlongtobeat-ts";
import {
  HLTB_ADDON_ENTRY_TYPES,
  HLTB_ADDON_GAME_TYPES,
  HLTB_GAME_TYPES,
  HLTB_PREFERRED_PLATFORM_SLUGS,
  HLTB_RELEASE_REGIONS,
  HLTB_WORLDWIDE_REGION,
  HLTB_LOOSE_TITLE_OVERLAP,
  HLTB_PLATFORM_YEAR_TOLERANCE,
  HLTB_SEARCH_RESULTS_PER_QUERY,
  HLTB_STRONG_TITLE_SIMILARITY,
  HLTB_CONFLICT_ENTRIES_LIMIT,
} from "../constants/hltb";
import {
  descriptionOverlap,
  jaccard,
  normalizeCoreTitle,
  normalizeTitle,
  normalizeTitleWithNumerals,
  titleSimilarity,
  tokenSetFrom,
} from "./title-match.utils";

export type HltbSearchEntry = {
  id: number;
  name: string;
  alias?: string;
  type?: string;
  mainTime?: number;
  mainExtraTime?: number;
  completionistTime?: number;
  allStylesTime?: number;
  coopTime?: number;
  multiplayerTime?: number;
  mainCount?: number;
  mainExtraCount?: number;
  completionistCount?: number;
  allStylesCount?: number;
  coopCount?: number;
  multiplayerCount?: number;
  imageUrl?: string;
  reviewScore?: number;
  similarity?: number;
  platforms?: string[];
  releaseYear?: number | null;
  popularity?: number;
};

/**
 * Everything we know about the local game that lets us tell HLTB entries
 * apart: its title plus the corroborating signals (platforms, release years).
 */
export type HltbMatchContext = {
  name: string;
  /** Canonical platform keys the game was released on. */
  platformKeys: Set<string>;
  /** Release years known for the game (from release_dates / first_release). */
  years: Set<number>;
  type?: string | null;
};

export type HltbMatchTier = "confirmed" | "exact-title";

export type HltbMatchResult = {
  entry: HltbSearchEntry;
  tier: HltbMatchTier;
};

const secondsToHours = (seconds?: number | null): number | null => {
  if (seconds == null || seconds <= 0) {
    return null;
  }

  return Math.round((seconds / 3600) * 10) / 10;
};

const normalizePlatform = (value: string): string =>
  (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/**
 * Maps differently-spelled platform names from our catalogue (IGDB-style) and
 * HowLongToBeat onto a shared key. Only the *mismatching* spellings need to be
 * listed here — names that are already identical after normalization match on
 * their own. Keeping this conservative means at worst a missed corroboration
 * (which the release-year signal still covers), never a wrong one.
 */
const PLATFORM_CANONICAL: Record<string, string> = {
  // Super Nintendo / Super Famicom
  "super nintendo": "snes",
  "super nintendo entertainment system": "snes",
  "super famicom": "snes",
  snes: "snes",
  // Nintendo Entertainment System / Famicom
  "nintendo entertainment system": "nes",
  famicom: "nes",
  "family computer": "nes",
  nes: "nes",
  // Desktop computers — HLTB collapses these into "PC"
  "pc microsoft windows": "pc",
  "microsoft windows": "pc",
  windows: "pc",
  dos: "pc",
  pc: "pc",
  // Sega Master System
  "sega master system mark iii": "sega master system",
  "master system": "sega master system",
  // Sega Mega Drive / Genesis
  "sega mega drive genesis": "genesis",
  "mega drive": "genesis",
  genesis: "genesis",
  // TurboGrafx-16 / PC Engine
  "turbografx 16 pc engine": "turbografx16",
  "turbografx 16": "turbografx16",
  "pc engine": "turbografx16",
  // TurboGrafx-CD / PC Engine CD
  "turbografx 16 pc engine cd": "turbografxcd",
  "turbografx cd": "turbografxcd",
  // Newer 3DS revision
  "new nintendo 3ds": "nintendo 3ds",
  // Mobile — HLTB collapses phone/tablet platforms into "Mobile"
  mobile: "mobile",
  ios: "mobile",
  android: "mobile",
  "windows phone": "mobile",
  "windows mobile": "mobile",
  "legacy mobile device": "mobile",
  "n gage": "mobile",
};

/** Resolves a platform name to a canonical key for cross-source comparison. */
export const canonicalPlatform = (name: string): string => {
  const normalized = normalizePlatform(name);

  return PLATFORM_CANONICAL[normalized] ?? normalized;
};

export const buildPlatformKeySet = (names: string[]): Set<string> =>
  new Set((names ?? []).map(canonicalPlatform).filter(Boolean));

type HltbEntryEvaluation = {
  entry: HltbSearchEntry;
  titleExact: boolean;
  titleScore: number;
  strongTitle: boolean;
  looseTitle: boolean;
  platformMatch: boolean;
  yearMatch: boolean;
  yearConflict: boolean;
  yearNear: boolean;
};

export const hltbAliases = (entry: Pick<HltbSearchEntry, "alias">): string[] =>
  (entry.alias ?? "")
    .split(",")
    .map((alias) => alias.trim())
    .filter(Boolean);

const entryTitles = (entry: HltbSearchEntry): string[] => [
  entry.name,
  ...hltbAliases(entry),
];

const evaluateTitle = (title: string, name: string) => {
  const entryTitle = normalizeTitleWithNumerals(title);
  const ctxTitle = normalizeTitleWithNumerals(name);
  const entryCore = normalizeCoreTitle(entryTitle);
  const ctxCore = normalizeCoreTitle(ctxTitle);
  const titleExact = entryTitle === ctxTitle;
  const coreExact = entryCore === ctxCore;
  const titleScore = Math.max(
    titleSimilarity(entryTitle, ctxTitle),
    jaccard(tokenSetFrom(entryCore), tokenSetFrom(ctxCore))
  );
  const entryTokens = tokenSetFrom(entryTitle);
  const ctxTokens = tokenSetFrom(ctxTitle);
  const [entryNumbers, ctxNumbers] = [entryTokens, ctxTokens].map((tokens) =>
    [...tokens]
      .filter((token) => /^\d+$/.test(token))
      .sort()
      .join(" ")
  );

  return {
    titleExact,
    titleScore,
    strongTitle:
      titleExact || coreExact || titleScore >= HLTB_STRONG_TITLE_SIMILARITY,
    looseTitle:
      descriptionOverlap(entryTokens, ctxTokens) >= HLTB_LOOSE_TITLE_OVERLAP &&
      (!entryNumbers || !ctxNumbers || entryNumbers === ctxNumbers),
  };
};

const evaluateEntry = (
  entry: HltbSearchEntry,
  ctx: HltbMatchContext
): HltbEntryEvaluation => {
  const titles = entryTitles(entry).map((title) =>
    evaluateTitle(title, ctx.name)
  );
  const titleExact = titles.some((title) => title.titleExact);
  const strongTitle = titles.some((title) => title.strongTitle);
  const looseTitle = titles.some((title) => title.looseTitle);
  const titleScore = Math.max(...titles.map((title) => title.titleScore));

  const entryPlatformKeys = (entry.platforms ?? []).map(canonicalPlatform);
  const platformMatch =
    ctx.platformKeys.size > 0 &&
    entryPlatformKeys.some((key) => ctx.platformKeys.has(key));

  const yearMatch =
    entry.releaseYear != null &&
    ctx.years.size > 0 &&
    [...ctx.years].some((year) => Math.abs(year - entry.releaseYear!) <= 1);

  const yearConflict =
    entry.releaseYear != null && ctx.years.size > 0 && !yearMatch;

  const yearNear =
    entry.releaseYear != null &&
    [...ctx.years].some(
      (year) =>
        Math.abs(year - entry.releaseYear!) <= HLTB_PLATFORM_YEAR_TOLERANCE
    );

  return {
    entry,
    titleExact,
    titleScore,
    strongTitle,
    looseTitle,
    platformMatch,
    yearMatch,
    yearConflict,
    yearNear,
  };
};

const rankEvaluations = (
  a: HltbEntryEvaluation,
  b: HltbEntryEvaluation
): number =>
  (Number(b.platformMatch) - Number(a.platformMatch)) * 8 +
  (Number(b.yearMatch) - Number(a.yearMatch)) * 4 +
  (Number(b.titleExact) - Number(a.titleExact)) * 2 +
  (b.titleScore - a.titleScore) +
  ((b.entry.similarity ?? 0) - (a.entry.similarity ?? 0));

const isCorroboratedCandidate = (item: HltbEntryEvaluation): boolean =>
  (item.strongTitle || item.looseTitle) && item.platformMatch && item.yearMatch;

const isAddon = (type?: string | null): boolean =>
  !!type && HLTB_ADDON_GAME_TYPES.includes(type);

const isBaseGameEntry = (
  entry: HltbSearchEntry,
  ctx: HltbMatchContext
): boolean => {
  if (!isAddon(ctx.type) || HLTB_ADDON_ENTRY_TYPES.includes(entry.type ?? "")) {
    return false;
  }

  const name = normalizeTitleWithNumerals(ctx.name);

  return entryTitles(entry).some((title) => {
    const base = normalizeTitleWithNumerals(title);

    return !!base && base !== name && `${name} `.startsWith(`${base} `);
  });
};

export const getEditionParentId = (game: {
  type?: string | null;
  relatedGames?: IRelatedGamesField | null;
}): string | null =>
  game.relatedGames?.version_parent && !isAddon(game.type)
    ? String(game.relatedGames.version_parent)
    : null;

/**
 * Picks the HLTB entry for a game, prioritising precision over coverage.
 *
 * 1. Confirmed: a strong title match (exact or order-independent token match)
 *    corroborated by a platform overlap or a matching release year.
 * 2. Exact-title fallback: when no entry can be corroborated but exactly one
 *    entry's title is an exact normalized match, accept it. The "exactly one"
 *    guard is what prevents picking a random "The Incredible Hulk" when several
 *    share the title and none can be confirmed.
 *
 * A release-year conflict vetoes both tiers: when our game and the entry both
 * carry release years and none of ours lines up with the entry's, the entry
 * belongs to a *different* game and platform overlap is not enough to accept it
 * (e.g. two same-titled "Mixtape" games released years apart, both on the same
 * platform). Re-releases named with an edition/version marker are exempt — for
 * them a year gap against HLTB's base entry is expected, not a conflict. So is
 * an exact title on a shared platform within HLTB_PLATFORM_YEAR_TOLERANCE
 * years: HLTB dates an entry by its earliest release (early access, the
 * Japanese or arcade original), which our release dates often lack.
 *
 * Anything else returns null — we would rather store no time than a wrong one.
 */
export const selectHltbMatch = (
  results: HltbSearchEntry[],
  ctx: HltbMatchContext
): HltbMatchResult | null => {
  if (!results?.length) {
    return null;
  }

  const isReRelease = normalizeTitle(ctx.name) !== normalizeCoreTitle(ctx.name);
  const evaluations = results
    .filter((entry) => !isBaseGameEntry(entry, ctx))
    .map((entry) => evaluateEntry(entry, ctx));
  const blockedByYear = (item: HltbEntryEvaluation): boolean =>
    item.yearConflict &&
    !isReRelease &&
    !(item.titleExact && item.platformMatch && item.yearNear);

  const confirmed = evaluations
    .filter(
      (item) =>
        item.strongTitle &&
        (item.platformMatch || item.yearMatch) &&
        !blockedByYear(item)
    )
    .sort(rankEvaluations);

  if (confirmed.length) {
    return { entry: confirmed[0].entry, tier: "confirmed" };
  }

  const exactTitle = evaluations.filter(
    (item) => item.titleExact && !blockedByYear(item)
  );

  if (exactTitle.length === 1) {
    return { entry: exactTitle[0].entry, tier: "exact-title" };
  }

  return null;
};

export type HltbConflict = {
  reason: IMatchReason;
  entries: HltbSearchEntry[];
  breakdowns: IScoreBreakdown[];
};

const toBreakdown = (
  item: HltbEntryEvaluation,
  ctx: HltbMatchContext
): IScoreBreakdown => ({
  title: item.titleExact ? 4 : item.strongTitle ? 2 : item.looseTitle ? 1 : 0,
  platforms:
    !ctx.platformKeys.size || !item.entry.platforms?.length
      ? 0
      : item.platformMatch
        ? 1
        : -1,
  date: item.yearMatch ? 3 : item.yearNear ? 1 : item.yearConflict ? -4 : 0,
  companies: 0,
  genre: 0,
  type: 0,
});

export const findHltbConflict = (
  results: HltbSearchEntry[],
  ctx: HltbMatchContext,
  limit = HLTB_CONFLICT_ENTRIES_LIMIT
): HltbConflict | null => {
  const evaluations = results
    .filter(
      (entry) =>
        hasHltbTimes(mapHltbEntryToField(entry)) && !isBaseGameEntry(entry, ctx)
    )
    .map((entry) => evaluateEntry(entry, ctx));
  const picked = evaluations
    .filter((item) => item.strongTitle || isCorroboratedCandidate(item))
    .sort(
      (a, b) =>
        Number(b.strongTitle) - Number(a.strongTitle) || rankEvaluations(a, b)
    )
    .slice(0, limit);

  if (!picked.length) return null;

  return {
    reason: !picked.some((item) => item.strongTitle)
      ? "weak-title"
      : picked.length > 1
        ? "competing-candidates"
        : "unverified-title",
    entries: picked.map(({ entry }) => entry),
    breakdowns: picked.map((item) => toBreakdown(item, ctx)),
  };
};

export const buildHltbMatchContext = (
  game: {
    name: string;
    type?: string | null;
    platformIds?: { toString(): string }[] | null;
    release_dates?: { year?: number | null }[] | null;
    first_release?: number | null;
  },
  platformNames: Map<string, string>
): HltbMatchContext => {
  const platformLabels = (game.platformIds ?? [])
    .map((id) => platformNames.get(String(id)))
    .filter((name): name is string => !!name);

  const years = new Set<number>();
  for (const release of game.release_dates ?? []) {
    if (release?.year) {
      years.add(release.year);
    }
  }
  if (game.first_release) {
    years.add(new Date(game.first_release * 1000).getUTCFullYear());
  }

  return {
    name: game.name,
    platformKeys: buildPlatformKeySet(platformLabels),
    years,
    type: game.type,
  };
};

const withTimes = (entry?: HltbSearchEntry | null): HltbSearchEntry | null =>
  entry && hasHltbTimes(mapHltbEntryToField(entry)) ? entry : null;

export const decideHltbMatch = (
  pool: HltbSearchEntry[],
  ctx: HltbMatchContext,
  parentEntry?: HltbSearchEntry | null
): { entry: HltbSearchEntry | null; conflict: HltbConflict | null } => {
  const entry =
    withTimes(selectHltbMatch(pool, ctx)?.entry) ?? withTimes(parentEntry);

  return { entry, conflict: entry ? null : findHltbConflict(pool, ctx) };
};

/** Thin wrapper kept for callers/tests that only need the entry. */
export const pickBestHltbMatch = (
  results: HltbSearchEntry[],
  ctx: HltbMatchContext
): HltbSearchEntry | null => selectHltbMatch(results, ctx)?.entry ?? null;

/**
 * Builds the search queries used to locate a game on HLTB. The first query is
 * always the full title; subtitle parts and a reversed "B A" variant are added
 * so titles HLTB stores in a different word order (e.g. "Super Mario Advance 2:
 * Super Mario World") are still reachable. Scoring always happens against the
 * original full title, so partial queries only widen the candidate pool.
 */
export const buildHltbSearchQueries = (name: string): string[] => {
  const queries: string[] = [];
  const seen = new Set<string>();

  const push = (query: string) => {
    const trimmed = query.trim();
    const key = trimmed.toLowerCase();
    if (trimmed && !seen.has(key)) {
      seen.add(key);
      queries.push(trimmed);
    }
  };

  push(name);

  // The edition-stripped core ("Hitman: Game of the Year Edition" -> "hitman")
  // is often the exact title HLTB stores the base game under, so search it too.
  push(normalizeCoreTitle(name));

  const parts = name
    .split(/[:\-–—]/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (parts.length > 1) {
    for (const part of parts) {
      if (part.split(/\s+/).length >= 2 || part.length > 6) {
        push(part);
      }
    }
    push([...parts].reverse().join(" "));
  }

  return queries.slice(0, 5);
};

const countOrNull = (count?: number | null): number | null =>
  count != null && count > 0 ? count : null;

export const mapHltbEntryToField = (entry: HltbSearchEntry): IHltbField => ({
  hltbId: String(entry.id),
  mainStory: secondsToHours(entry.mainTime),
  mainExtra: secondsToHours(entry.mainExtraTime),
  completionist: secondsToHours(entry.completionistTime),
  allStyles: secondsToHours(entry.allStylesTime),
  coop: secondsToHours(entry.coopTime),
  multiplayer: secondsToHours(entry.multiplayerTime),
  mainStoryCount: countOrNull(entry.mainCount),
  mainExtraCount: countOrNull(entry.mainExtraCount),
  completionistCount: countOrNull(entry.completionistCount),
  allStylesCount: countOrNull(entry.allStylesCount),
  coopCount: countOrNull(entry.coopCount),
  multiplayerCount: countOrNull(entry.multiplayerCount),
  reviewScore:
    entry.reviewScore != null && entry.reviewScore > 0
      ? entry.reviewScore
      : null,
  imageUrl: entry.imageUrl || null,
  platforms: entry.platforms ?? [],
  releaseYear: entry.releaseYear ?? null,
  similarity: entry.similarity ?? null,
  alias: entry.alias || null,
  type: entry.type || null,
  sourceName: entry.name,
  updatedAt: new Date().toISOString(),
});

const HLTB_TIME_FIELDS = [
  "mainStory",
  "mainExtra",
  "completionist",
  "coop",
  "multiplayer",
] as const;

export const hasHltbTimes = (hltb?: IHltbField | null): boolean =>
  !!hltb && HLTB_TIME_FIELDS.some((field) => hltb[field] != null);

const VOLATILE_HLTB_FIELDS = new Set(["updatedAt", "similarity"]);

export const isSameHltb = (a: IHltbField, b: IHltbField): boolean =>
  [...new Set([...Object.keys(a), ...Object.keys(b)])]
    .filter((key) => !VOLATILE_HLTB_FIELDS.has(key))
    .every(
      (key) =>
        JSON.stringify(a[key as keyof IHltbField] ?? null) ===
        JSON.stringify(b[key as keyof IHltbField] ?? null)
    );

const HLTB_IMAGE_URL = "https://howlongtobeat.com/games/";

export const mapRawHltbEntry = (
  raw: HowLongToBeatResultEntry
): HltbSearchEntry => ({
  id: raw.game_id,
  name: raw.game_name,
  alias: raw.game_alias,
  type: raw.game_type,
  mainTime: raw.comp_lvl_sp ? raw.comp_main : undefined,
  mainExtraTime: raw.comp_lvl_sp ? raw.comp_plus : undefined,
  completionistTime: raw.comp_lvl_sp ? raw.comp_100 : undefined,
  allStylesTime: raw.comp_lvl_sp ? raw.comp_all : undefined,
  coopTime: raw.comp_lvl_co ? raw.invested_co : undefined,
  multiplayerTime: raw.comp_lvl_mp ? raw.invested_mp : undefined,
  mainCount: raw.comp_lvl_sp ? raw.comp_main_count : undefined,
  mainExtraCount: raw.comp_lvl_sp ? raw.comp_plus_count : undefined,
  completionistCount: raw.comp_lvl_sp ? raw.comp_100_count : undefined,
  allStylesCount: raw.comp_lvl_sp ? raw.comp_all_count : undefined,
  coopCount: raw.comp_lvl_co ? raw.invested_co_count : undefined,
  multiplayerCount: raw.comp_lvl_mp ? raw.invested_mp_count : undefined,
  imageUrl: raw.game_image ? `${HLTB_IMAGE_URL}${raw.game_image}` : undefined,
  reviewScore: raw.review_score,
  platforms: raw.profile_platform ? raw.profile_platform.split(", ") : [],
  releaseYear: raw.release_world,
  popularity: raw.profile_popular,
});

export type HltbCatalog = {
  entries: HltbSearchEntry[];
  byId: Map<number, HltbSearchEntry>;
  index: Map<string, number[]>;
};

const titleTokens = (value: string): string[] =>
  normalizeTitleWithNumerals(value).split(" ").filter(Boolean);

export const buildHltbCatalog = (entries: HltbSearchEntry[]): HltbCatalog => {
  const index = new Map<string, number[]>();

  entries.forEach((entry, position) => {
    for (const token of new Set(entryTitles(entry).flatMap(titleTokens))) {
      const positions = index.get(token);
      if (positions) positions.push(position);
      else index.set(token, [position]);
    }
  });

  return {
    entries,
    byId: new Map(entries.map((entry) => [entry.id, entry])),
    index,
  };
};

const hasSorted = (values: number[], value: number): boolean => {
  let low = 0;
  let high = values.length - 1;

  while (low <= high) {
    const middle = (low + high) >> 1;
    if (values[middle] === value) return true;
    if (values[middle] < value) low = middle + 1;
    else high = middle - 1;
  }

  return false;
};

export const findCatalogCandidates = (
  catalog: HltbCatalog,
  name: string
): HltbSearchEntry[] => {
  const pool = new Map<number, HltbSearchEntry>();

  for (const query of buildHltbSearchQueries(name)) {
    const [smallest, ...rest] = [...new Set(titleTokens(query))]
      .map((token) => catalog.index.get(token) ?? [])
      .sort((a, b) => a.length - b.length);

    if (!smallest?.length) continue;

    const found = smallest
      .filter((position) => rest.every((list) => hasSorted(list, position)))
      .map((position) => catalog.entries[position])
      .sort((a, b) => (b.popularity ?? 0) - (a.popularity ?? 0))
      .slice(0, HLTB_SEARCH_RESULTS_PER_QUERY);

    for (const entry of found) {
      if (!pool.has(entry.id)) {
        pool.set(entry.id, {
          ...entry,
          similarity: Math.max(
            getMatchScore(entry.name, query),
            getMatchScore(entry.alias ?? "", query)
          ),
        });
      }
    }
  }

  return [...pool.values()];
};

export const toHltbCandidate = (
  game: { _id: unknown; slug: string; name: string },
  breakdown: IScoreBreakdown
): IScoredCandidate => ({
  game: game as unknown as TMatchCandidate,
  score: breakdown.title + breakdown.platforms + breakdown.date,
  breakdown,
  dateSignal:
    breakdown.date >= 3
      ? "confirms"
      : breakdown.date < 0
        ? "contradicts"
        : "unknown",
  descriptionSignal: "unknown",
  hasCompanyMismatch: false,
  isDistinctiveTitle: breakdown.title >= 4,
  isMainTitleMatch: breakdown.title >= 4,
  isCorroborated: breakdown.date >= 3 || breakdown.platforms > 0,
  isContradicted: breakdown.date < 0,
});

export const isOfferedLinkedEntry = ({
  breakdown,
}: {
  breakdown: IScoreBreakdown;
}) =>
  breakdown.title >= 4 &&
  breakdown.platforms >= 0 &&
  breakdown.date >= 0 &&
  breakdown.platforms + breakdown.date > 0;

export const hltbConflictReason = ([
  best,
  ...rest
]: IScoredCandidate[]): IMatchReason =>
  rest.length
    ? "competing-candidates"
    : best.isContradicted
      ? "date-contradicts"
      : best.breakdown.title < 2
        ? "weak-title"
        : "unverified-title";

export const mapHltbPlatformIds = (
  names: string[],
  platforms: { _id: { toString(): string }; name: string; slug: string }[]
): string[] => {
  const ids = new Set<string>();

  for (const name of names) {
    const key = canonicalPlatform(name);
    const preferred = HLTB_PREFERRED_PLATFORM_SLUGS[key];

    for (const platform of platforms) {
      if (
        canonicalPlatform(platform.name) === key &&
        (!preferred || preferred.includes(platform.slug))
      ) {
        ids.add(platform._id.toString());
      }
    }
  }

  return [...ids];
};

export type HltbRelease = { date: string; region: number };

export type HltbPage = {
  summary: string | null;
  developers: string[];
  publishers: string[];
  released: string | null;
  releases: HltbRelease[];
  steamAppId: number | null;
};

const listOf = (value: unknown): string[] =>
  typeof value === "string"
    ? value
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean)
    : [];

const hltbDate = (value: unknown): string | null => {
  if (typeof value !== "string") return null;

  const parts = value.split("-");
  const known = parts.findIndex((part) => /^0*$/.test(part));
  const date = parts.slice(0, known === -1 ? parts.length : known).join("-");

  return parsePartialDate(date) ? date : null;
};

export const readHltbPage = (raw: Record<string, unknown> = {}): HltbPage => {
  const summary =
    typeof raw.profile_summary === "string"
      ? decodeHtml(raw.profile_summary)
      : "";
  const world = hltbDate(raw.release_world);
  const regional = Object.entries(HLTB_RELEASE_REGIONS).flatMap(
    ([key, region]) => {
      const date = hltbDate(raw[key]);

      return date ? [{ date, region }] : [];
    }
  );
  const dates = new Set(regional.map(({ date }) => date));
  const [onlyDate] = dates;
  const releases =
    dates.size === 1 && (!world || world === onlyDate)
      ? [{ date: onlyDate, region: HLTB_WORLDWIDE_REGION }]
      : regional.length
        ? regional
        : world
          ? [{ date: world, region: HLTB_WORLDWIDE_REGION }]
          : [];
  const released = world ?? [...dates].sort()[0] ?? null;
  const steamAppId = Number(raw.profile_steam);

  return {
    summary: summary || null,
    developers: listOf(raw.profile_dev),
    publishers: listOf(raw.profile_pub),
    released,
    releases,
    steamAppId: steamAppId > 0 ? steamAppId : null,
  };
};

export const hltbPageFields = (
  page: HltbPage | null,
  {
    releaseYear,
    platformIds = [],
  }: { releaseYear?: number | null; platformIds?: string[] } = {}
): Partial<IAddGameRequest> => {
  const developers = page?.developers ?? [];
  const publishers = page?.publishers ?? [];
  const yearOnly = releaseYear ? String(releaseYear) : null;
  const released = parsePartialDate(page?.released ?? yearOnly);
  const releases = page?.releases.length
    ? page.releases
    : yearOnly
      ? [{ date: yearOnly, region: HLTB_WORLDWIDE_REGION }]
      : [];

  return {
    summary: page?.summary ?? null,
    companies: [...new Set([...developers, ...publishers])].map((name) => ({
      name,
      developer: developers.includes(name),
      publisher: publishers.includes(name),
      porting: false,
      supporting: false,
    })),
    first_release: released ? released.getTime() / 1000 : null,
    release_dates: releases.flatMap(({ date, region }) => {
      const release = toReleaseDate(date);

      return release
        ? platformIds.map((platformId) => ({ ...release, platformId, region }))
        : [];
    }),
  };
};

export const buildHltbGamePayload = (
  entry: HltbSearchEntry,
  {
    slug,
    platformIds,
    page,
  }: { slug: string; platformIds: string[]; page: HltbPage | null }
): IAddGameRequest =>
  ({
    name: entry.name.trim(),
    slug,
    type: HLTB_GAME_TYPES[entry.type ?? ""] ?? "Main Game",
    cover: entry.imageUrl ?? null,
    alternative_names: hltbAliases(entry),
    ...hltbPageFields(page, { releaseYear: entry.releaseYear, platformIds }),
    platformIds,
    externalPages: [
      {
        name: "HowLongToBeat",
        uid: String(entry.id),
        url: `https://howlongtobeat.com/game/${entry.id}`,
      },
      ...(page?.steamAppId
        ? [
            {
              name: "Steam",
              uid: String(page.steamAppId),
              url: `https://store.steampowered.com/app/${page.steamAppId}`,
            },
          ]
        : []),
    ],
    hltb: mapHltbEntryToField(entry),
  }) as IAddGameRequest;
