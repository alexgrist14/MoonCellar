import { IHltbField } from "src/shared/zod/schemas/games.schema";
import {
  HLTB_NOT_FOUND_RETRY_DAYS,
  HLTB_STRONG_TITLE_SIMILARITY,
} from "../constants/hltb";

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

/** Lowercase, strip diacritics/punctuation, collapse whitespace. */
export const normalizeTitle = (value: string): string =>
  (value ?? "")
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

/**
 * Edition / version markers that a re-release carries but the canonical HLTB
 * entry usually does not (e.g. "Final Fantasy: 20th Anniversary Edition" is
 * listed simply as "Final Fantasy"). Stripping them yields a "core" title used
 * as an extra match signal. Operates on already-normalized text. Deliberately
 * excludes words that denote a *different* game (e.g. "Remake").
 */
// Adjectives that introduce an "<adj> Edition / Version" re-release. Curated on
// purpose: ordinals/numbers ("Fourth Edition") are excluded because there they
// denote a *sequel*, not an edition. Includes platform names because HLTB files
// platform re-releases ("Wii Edition") under the base game.
const EDITION_ADJECTIVES = [
  "complete",
  "definitive",
  "special",
  "deluxe",
  "ultimate",
  "ultimate hd",
  "gold",
  "premium",
  "collector s",
  "collectors",
  "enhanced",
  "legendary",
  "standard",
  "royal",
  "international",
  "survival",
  "warmastered",
  "remastered",
  "remaster",
  "java",
  "wii u",
  "wii",
  "psp",
  "ps2",
  "ps3",
  "ps4",
  "ps5",
  "ds",
  "3ds",
  "switch",
  "xbox",
  "pc",
  "hd",
  "vr",
  "vita",
  "mobile",
  "ios",
  "android",
  "arcade",
  "gamecube",
  "gba",
  "n64",
  "dreamcast",
  "saturn",
  "genesis",
].join("|");

/**
 * Edition / version / remaster markers that a re-release carries but the
 * canonical HLTB entry usually does not. Stripping them yields a "core" title
 * used as an extra match signal. Order matters: multi-word phrases run before
 * the generic "<adj> edition" rule. Deliberately excludes words that denote a
 * *different* game ("Remake", sequel ordinals).
 */
const EDITION_PATTERNS: RegExp[] = [
  /\b\d+(?:st|nd|rd|th) anniversary edition\b/g,
  /\banniversary edition\b/g,
  /\bgame of the year(?: edition)?\b/g,
  new RegExp(`\\b(?:the )?(?:${EDITION_ADJECTIVES}) (?:edition|version)\\b`, "g"),
  // "Director's Cut" — note normalizeTitle has already dropped the apostrophe.
  /\bdirectors? cut\b/g,
  // Standalone trailing markers that appear without the word "edition".
  /\b(?:remastered|remaster|redux|goty|deluxe|enhanced|hd)\b/g,
  // HLTB sometimes suffixes DLC entries with "DLC".
  /\bdlc\b/g,
];

/** Title with recognized edition/version markers removed. */
export const normalizeCoreTitle = (value: string): string => {
  const normalized = normalizeTitle(value);
  let core = normalized;

  for (const pattern of EDITION_PATTERNS) {
    core = core.replace(pattern, " ");
  }

  core = core.trim().replace(/\s+/g, " ");

  return core || normalized;
};

const tokenSetFrom = (value: string): Set<string> =>
  new Set(value.split(" ").filter(Boolean));

const jaccard = (a: Set<string>, b: Set<string>): number => {
  if (!a.size && !b.size) {
    return 1;
  }

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) {
      intersection += 1;
    }
  }

  const union = a.size + b.size - intersection;

  return union === 0 ? 0 : intersection / union;
};

/** Order-independent token-set similarity (Jaccard) in [0, 1]. */
export const titleSimilarity = (a: string, b: string): number =>
  jaccard(tokenSetFrom(normalizeTitle(a)), tokenSetFrom(normalizeTitle(b)));

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
  platformMatch: boolean;
  yearMatch: boolean;
  yearConflict: boolean;
};

const evaluateEntry = (
  entry: HltbSearchEntry,
  ctx: HltbMatchContext
): HltbEntryEvaluation => {
  const titleExact = normalizeTitle(entry.name) === normalizeTitle(ctx.name);

  const entryCore = normalizeCoreTitle(entry.name);
  const ctxCore = normalizeCoreTitle(ctx.name);
  const coreExact = entryCore === ctxCore;

  // Score against both the full and edition-stripped titles, keeping the best,
  // so a re-release suffix ("20th Anniversary Edition") doesn't sink an
  // otherwise exact match.
  const titleScore = Math.max(
    titleSimilarity(entry.name, ctx.name),
    jaccard(tokenSetFrom(entryCore), tokenSetFrom(ctxCore))
  );
  const strongTitle =
    titleExact || coreExact || titleScore >= HLTB_STRONG_TITLE_SIMILARITY;

  const entryPlatformKeys = (entry.platforms ?? []).map(canonicalPlatform);
  const platformMatch =
    ctx.platformKeys.size > 0 &&
    entryPlatformKeys.some((key) => ctx.platformKeys.has(key));

  const yearMatch =
    entry.releaseYear != null &&
    ctx.years.size > 0 &&
    [...ctx.years].some((year) => Math.abs(year - entry.releaseYear!) <= 1);

  // Both sides know a year, yet none of ours lines up with the entry's. For
  // same-title games (e.g. two "Mixtape" releases years apart) this is the
  // signal that the entry belongs to a *different* game, not to ours.
  const yearConflict =
    entry.releaseYear != null && ctx.years.size > 0 && !yearMatch;

  return {
    entry,
    titleExact,
    titleScore,
    strongTitle,
    platformMatch,
    yearMatch,
    yearConflict,
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
 * them a year gap against HLTB's base entry is expected, not a conflict.
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
  const blockedByYear = (item: HltbEntryEvaluation): boolean =>
    item.yearConflict && !isReRelease;

  const evaluations = results.map((entry) => evaluateEntry(entry, ctx));

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
  reviewScore: entry.reviewScore != null && entry.reviewScore > 0 ? entry.reviewScore : null,
  imageUrl: entry.imageUrl || null,
  platforms: entry.platforms ?? [],
  releaseYear: entry.releaseYear ?? null,
  similarity: entry.similarity ?? null,
  alias: entry.alias || null,
  type: entry.type || null,
  sourceName: entry.name,
  updatedAt: new Date().toISOString(),
});

export const hasHltbTimes = (hltb?: IHltbField | null): boolean =>
  !!hltb &&
  (hltb.mainStory != null ||
    hltb.mainExtra != null ||
    hltb.completionist != null);

const missingHltbTimesFilter = {
  $and: [
    {
      $or: [
        { "hltb.mainStory": { $exists: false } },
        { "hltb.mainStory": null },
      ],
    },
    {
      $or: [
        { "hltb.mainExtra": { $exists: false } },
        { "hltb.mainExtra": null },
      ],
    },
    {
      $or: [
        { "hltb.completionist": { $exists: false } },
        { "hltb.completionist": null },
      ],
    },
  ],
};

export const getStaleBeforeIso = (staleDays: number, now = Date.now()) =>
  new Date(now - staleDays * 24 * 60 * 60 * 1000).toISOString();

export const buildMissingHltbFilter = () => ({
  $and: [
    { $or: [{ hltb: { $exists: false } }, missingHltbTimesFilter] },
    { hltbNotFoundAt: { $exists: false } },
  ],
});

export const buildIncrementalHltbFilter = (
  staleDays: number,
  now = Date.now(),
  notFoundRetryDays = HLTB_NOT_FOUND_RETRY_DAYS
) => {
  const staleBefore = getStaleBeforeIso(staleDays, now);
  const notFoundRetryBefore = getStaleBeforeIso(notFoundRetryDays, now);

  return {
    $or: [
      {
        $and: [
          {
            $or: [
              { hltb: { $exists: false } },
              { "hltb.updatedAt": { $exists: false } },
              missingHltbTimesFilter,
            ],
          },
          { hltbNotFoundAt: { $exists: false } },
        ],
      },
      { "hltb.updatedAt": { $lt: staleBefore } },
      { hltbNotFoundAt: { $lt: notFoundRetryBefore } },
    ],
  };
};
