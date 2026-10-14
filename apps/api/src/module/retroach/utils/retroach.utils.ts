import * as fuzzysort from "fuzzysort";
import type { GameList } from "@retroachievements/api";
import type {
  IMatchReason,
  IRetroachievementsField,
} from "@mooncellar/schemas";
import type { IScoredCandidate } from "../../games/matching/game-matcher.types";
import { getFormattedTitle } from "../../../shared/utils";
import {
  RA_AMBIGUITY_GAP,
  RA_CONFLICT_CANDIDATES_LIMIT,
  RA_NAME_MATCH_THRESHOLD,
} from "../constants/sync";

export const RA_MEDIA_URL = "https://media.retroachievements.org";

export type TRaSet = Pick<
  GameList[number],
  "id" | "title" | "consoleId" | "consoleName" | "numAchievements"
> & { imageIcon?: string; imageBoxArt?: string };

export const toRaSetEntry = (raGame: TRaSet): IRetroachievementsField => ({
  gameId: raGame.id,
  consoleId: raGame.consoleId,
  consoleName: raGame.consoleName,
  ...(raGame.imageIcon && {
    imageIcon: `${RA_MEDIA_URL}${raGame.imageIcon}`,
  }),
  numAchievements: raGame.numAchievements,
});

export type MatchableGame = { name: string };

export const rankGamesByTitle = <T extends MatchableGame>(
  raTitle: string,
  candidates: T[],
  threshold = RA_NAME_MATCH_THRESHOLD,
  limit = RA_CONFLICT_CANDIDATES_LIMIT
): { game: T; score: number; matchedTitle: string }[] => {
  if (!candidates.length) return [];

  const targets = candidates.map((game) => ({
    game,
    name: getFormattedTitle(game.name),
  }));

  const best = new Map<T, { score: number; matchedTitle: string }>();

  for (const title of raTitle.split("|").map((part) => part.trim())) {
    for (const result of fuzzysort.go(getFormattedTitle(title), targets, {
      key: "name",
      limit,
      threshold,
    })) {
      const { game } = result.obj;

      if ((best.get(game)?.score ?? -1) < result.score) {
        best.set(game, { score: result.score, matchedTitle: title });
      }
    }
  }

  return [...best]
    .map(([game, match]) => ({ game, ...match }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
};

const toTitleKey = (title: string) =>
  getFormattedTitle(title).trim().toLowerCase();

export const pickExactTitleMatch = <T extends MatchableGame>(
  raTitle: string,
  ranked: { game: T }[]
): T | null => {
  const variants = new Set(raTitle.split("|").map(toTitleKey));
  const exact = ranked.filter(({ game }) =>
    variants.has(toTitleKey(game.name))
  );

  return exact.length === 1 ? exact[0].game : null;
};

export const matchGameByTitle = <T extends MatchableGame>(
  raTitle: string,
  candidates: T[],
  threshold = RA_NAME_MATCH_THRESHOLD
): T | null =>
  rankGamesByTitle(raTitle, candidates, threshold)[0]?.game ?? null;

type TId = { toString(): string };

export type TRaCandidate = MatchableGame & {
  _id: TId;
  platformIds?: TId[];
  retroachievements?: IRetroachievementsField[] | null;
};

export type TRaRanked<T> = {
  game: T;
  score: number;
  matchedTitle: string;
  scored?: IScoredCandidate;
};

export type TRaPick<T> = {
  matches: T[];
  ranked: TRaRanked<T>[];
  reason?: IMatchReason | null;
};

export type TRaPicker = <T extends TRaCandidate>(
  raGame: TRaSet,
  candidates: T[]
) => TRaPick<T>;

export const pickRaMatchesByTitle: TRaPicker = (
  { title: raTitle },
  candidates
) => {
  const ranked = rankGamesByTitle(raTitle, candidates);
  const [best, runnerUp] = ranked;

  if (!best) return { matches: [], ranked };

  if (
    runnerUp &&
    runnerUp.game._id.toString() !== best.game._id.toString() &&
    best.score - runnerUp.score < RA_AMBIGUITY_GAP
  ) {
    const exact = pickExactTitleMatch(raTitle, ranked);

    return { matches: exact ? [exact] : [], ranked };
  }

  return { matches: [best.game], ranked };
};

export type TRaResolution = { status: string; winners: TId[] };

export const matchRaSets = <T extends TRaCandidate>({
  raGames,
  games,
  platforms,
  resolutions,
  pick = pickRaMatchesByTitle,
}: {
  raGames: TRaSet[];
  games: T[];
  platforms: { _id: TId; raId?: number | null }[];
  resolutions: Map<string, TRaResolution>;
  pick?: TRaPicker;
}) => {
  const platformsByRaId = new Map<number, string[]>();
  for (const platform of platforms) {
    if (platform.raId == null) continue;
    const list = platformsByRaId.get(platform.raId);
    const id = platform._id.toString();
    list ? list.push(id) : platformsByRaId.set(platform.raId, [id]);
  }

  const gamesByPlatformId = new Map<string, T[]>();
  for (const game of games) {
    for (const platformId of game.platformIds ?? []) {
      const key = platformId.toString();
      const list = gamesByPlatformId.get(key);
      list ? list.push(game) : gamesByPlatformId.set(key, [game]);
    }
  }

  const gameIds: Record<string, IRetroachievementsField[]> = {};
  const ambiguous: {
    raGame: TRaSet;
    ranked: TRaRanked<T>[];
    reason?: IMatchReason | null;
  }[] = [];

  for (const raGame of raGames) {
    const platformIds = platformsByRaId.get(raGame.consoleId);
    if (!platformIds?.length) continue;

    const seenIds = new Set<string>();
    const candidates: T[] = [];

    for (const platformId of platformIds) {
      for (const game of gamesByPlatformId.get(platformId) ?? []) {
        const id = game._id.toString();
        if (!seenIds.has(id)) {
          seenIds.add(id);
          candidates.push(game);
        }
      }
    }

    const resolution = resolutions.get(String(raGame.id));
    let matches: { _id: TId }[] = [];

    if (resolution) {
      if (resolution.status !== "resolved") continue;

      matches = resolution.winners.map((_id) => ({ _id }));
    } else {
      const picked = pick(raGame, candidates);

      if (!picked.matches.length) {
        if (picked.ranked.length) {
          ambiguous.push({
            raGame,
            ranked: picked.ranked,
            reason: picked.reason,
          });
        }
        continue;
      }

      matches = picked.matches;
    }

    for (const match of matches) {
      const id = match._id.toString();
      const value = toRaSetEntry(raGame);
      const list = gameIds[id];

      list ? list.push(value) : (gameIds[id] = [value]);
    }
  }

  const seenRaIds = new Set(raGames.map(({ id }) => id));

  for (const game of games) {
    const id = game._id.toString();
    const list = gameIds[id];

    if (!list) continue;

    for (const entry of game.retroachievements ?? []) {
      const resolution = resolutions.get(String(entry.gameId));
      const isPinnedHere =
        resolution?.status === "resolved" &&
        resolution.winners.some((winner) => winner.toString() === id);

      if (
        isPinnedHere &&
        !seenRaIds.has(entry.gameId) &&
        !list.some(({ gameId }) => gameId === entry.gameId)
      ) {
        list.push(entry);
      }
    }
  }

  return { gameIds, ambiguous };
};

export type NamedConsole = { name: string };

const normalizeSegment = (value: string) =>
  value.trim().toLowerCase().replace(/\s+/g, " ");

const VENDOR_PREFIXES = [
  "sega",
  "nintendo",
  "sony",
  "microsoft",
  "atari",
  "commodore",
  "nec",
  "sharp",
  "bandai",
  "snk",
  "coleco",
  "mattel",
  "philips",
  "panasonic",
  "apple",
  "magnavox",
];

// "Sega Saturn" -> "Saturn": RA often drops the manufacturer name that IGDB
// keeps in the platform name. A purely numeric remainder is rejected (e.g.
// "Nintendo 64" -> "64") since a bare number is generic enough to coincide
// with an unrelated platform's version suffix, like "Dragon 32/64".
const stripVendorPrefix = (segment: string): string | null => {
  const words = segment.split(" ");
  if (words.length < 2) return null;

  const [first, ...rest] = words;
  if (!VENDOR_PREFIXES.includes(first.toLowerCase())) return null;

  const remainder = rest.join(" ").trim();
  if (!remainder || /^\d+$/.test(remainder)) return null;

  return remainder;
};

// "Nintendo Entertainment System" -> "NES": RA uses the acronym while IGDB
// spells the platform out. Numeric words (the "2" in "PlayStation 2") are
// excluded so a sequel's number can never fold into a shorter acronym that
// might collide with an unrelated earlier platform. A minimum length of 3
// is required — 2-letter acronyms collide too easily by chance (e.g. both
// "Philips CD-i" and "PC (Microsoft Windows)" reduce to "PC").
const acronymOf = (segment: string): string | null => {
  const words = segment.split(" ").filter((word) => /^[A-Za-z]/.test(word));
  if (words.length < 2 || words.length > 6) return null;

  const acronym = words.map((word) => word[0]).join("");
  return acronym.length >= 3 ? acronym : null;
};

const splitNameSegments = (name: string): string[] => {
  const segments = new Set<string>();
  const trimmed = name.trim();
  segments.add(trimmed);

  for (const part of trimmed.split("/")) {
    const piece = part.trim();
    if (piece) segments.add(piece);
  }

  const withoutParens = trimmed.replace(/\s*\([^)]*\)\s*/g, " ").trim();
  if (withoutParens) segments.add(withoutParens);

  for (const match of trimmed.match(/\(([^)]+)\)/g) ?? []) {
    const piece = match.slice(1, -1).trim();
    if (piece) segments.add(piece);
  }

  for (const segment of [...segments]) {
    const stripped = stripVendorPrefix(segment);
    if (stripped) segments.add(stripped);

    const acronym = acronymOf(segment);
    if (acronym) segments.add(acronym);
  }

  return [...segments];
};

// Platform families reuse the same base name across generations (e.g.
// "PlayStation" / "PlayStation 2"), so fuzzy/subsequence matching is unsafe
// here: it would happily attach a newer platform to an older RA console.
// Instead we require an exact (normalized) name segment to be shared, and
// prefer the most specific (longest) shared segment when several consoles
// qualify — e.g. "PC Engine CD" over "TurboGrafx-16" for the CD add-on.
export const matchPlatformToConsole = <T extends NamedConsole>(
  platformName: string,
  consoles: T[]
): T | null => {
  const platformSegments = new Set(
    splitNameSegments(platformName).map(normalizeSegment)
  );

  let best: { console: T; strength: number } | null = null;

  for (const console of consoles) {
    const consoleSegments = splitNameSegments(console.name).map(
      normalizeSegment
    );

    let strength = 0;
    for (const segment of consoleSegments) {
      if (platformSegments.has(segment)) {
        strength = Math.max(strength, segment.split(" ").length);
      }
    }

    if (strength > 0 && (!best || strength > best.strength)) {
      best = { console, strength };
    }
  }

  return best?.console ?? null;
};
