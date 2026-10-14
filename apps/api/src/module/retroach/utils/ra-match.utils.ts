import {
  resolveMatch,
  gameTitleKeys,
} from "../../games/matching/game-matcher.utils";
import { RA_MATCH_PROFILE } from "../../games/matching/match-profiles";
import type {
  IMatchSubject,
  TMatchCandidate,
} from "../../games/matching/game-matcher.types";
import {
  normalizeTitle,
  normalizeTitleWithNumerals,
  titleKey,
  titleKeyVariants,
  tokenSetFrom,
} from "../../games/utils/title-match.utils";
import { RA_CONFLICT_CANDIDATES_LIMIT } from "../constants/sync";
import type {
  TRaCandidate,
  TRaPick,
  TRaPicker,
  TRaSet,
} from "./retroach.utils";

const RA_TAG = /~[^~]*~/g;
const RA_TRAILING_ARTICLE = /^(.+?), (the|a|an)\b/i;

export const raTitleVariants = (title: string): string[] =>
  title
    .split("|")
    .map((part) =>
      part
        .replace(RA_TAG, " ")
        .replace(RA_TRAILING_ARTICLE, "$2 $1")
        .replace(/\s+/g, " ")
        .trim()
    )
    .filter(Boolean);

const numeralForms = (titles: string[]): string[] =>
  titles
    .map((title) => [title, normalizeTitleWithNumerals(title)])
    .filter(([title, folded]) => folded !== normalizeTitle(title))
    .map(([, folded]) => folded);

export const toRaMatchSubject = (
  raGame: TRaSet,
  platformSlugs: string[],
  foldNumerals = false
): IMatchSubject => {
  const variants = raTitleVariants(raGame.title);
  const [name = raGame.title, ...rest] = variants;

  return {
    id: String(raGame.id),
    name,
    originalName: name,
    alternativeNames: [
      ...rest,
      ...(foldNumerals ? numeralForms(variants) : []),
    ],
    type: "",
    releaseDates: [],
    developers: [],
    publishers: [],
    platformSlugs,
    description: "",
  };
};

const titleKeys = (title: string): string[] => [
  titleKey(title),
  ...titleKeyVariants(title),
];

const push = <K, V>(map: Map<K, V[]>, key: K, value: V) => {
  const list = map.get(key);
  list ? list.push(value) : map.set(key, [value]);
};

type TConsoleIndex = {
  prepared: Map<TMatchCandidate, TRaCandidate>;
  byKey: Map<string, TMatchCandidate[]>;
  byToken: Map<string, TMatchCandidate[]>;
};

const buildIndex = (
  candidates: TRaCandidate[],
  foldNumerals: boolean
): TConsoleIndex => {
  const index: TConsoleIndex = {
    prepared: new Map(),
    byKey: new Map(),
    byToken: new Map(),
  };

  for (const original of candidates) {
    const game = original as unknown as TMatchCandidate;
    const alternativeNames = game.alternative_names ?? [];
    const prepared = foldNumerals
      ? {
          ...game,
          alternative_names: [
            ...alternativeNames,
            ...numeralForms([game.name, ...alternativeNames]),
          ],
        }
      : game;
    const titles = [prepared.name, ...(prepared.alternative_names ?? [])];

    index.prepared.set(prepared, original);
    for (const key of gameTitleKeys(prepared)) push(index.byKey, key, prepared);
    for (const token of new Set(
      titles.flatMap((title) => [...tokenSetFrom(normalizeTitle(title))])
    )) {
      push(index.byToken, token, prepared);
    }
  }

  return index;
};

const findPool = (
  subject: IMatchSubject,
  index: TConsoleIndex
): TMatchCandidate[] => {
  const pool = new Set<TMatchCandidate>();
  const titles = [subject.name, ...subject.alternativeNames];

  for (const key of titles.flatMap(titleKeys)) {
    for (const game of index.byKey.get(key) ?? []) pool.add(game);
  }

  for (const title of titles) {
    const tokens = [...tokenSetFrom(normalizeTitle(title))];
    const needed = Math.ceil(
      tokens.length * RA_MATCH_PROFILE.title.fuzzySimilarity
    );
    const hits = new Map<TMatchCandidate, number>();

    for (const token of tokens) {
      for (const game of index.byToken.get(token) ?? []) {
        hits.set(game, (hits.get(game) ?? 0) + 1);
      }
    }

    for (const [game, count] of hits) {
      if (count >= needed) pool.add(game);
    }
  }

  return [...pool];
};

export const buildRaPlatformMaps = (
  platforms: {
    _id: { toString(): string };
    slug?: string | null;
    raId?: number | null;
  }[]
) => {
  const platformSlugById = new Map<string, string>();
  const slugsByConsole = new Map<number, string[]>();

  for (const { _id, slug, raId } of platforms) {
    if (!slug) continue;
    platformSlugById.set(_id.toString(), slug);
    if (raId != null) push(slugsByConsole, raId, slug);
  }

  return { platformSlugById, slugsByConsole };
};

export const RA_ENGINE_GAME_FIELDS =
  "name slug platformIds retroachievements alternative_names type";

export const createRaEnginePicker = ({
  platformSlugById,
  slugsByConsole,
  foldNumerals = true,
}: {
  platformSlugById: Map<string, string>;
  slugsByConsole: Map<number, string[]>;
  foldNumerals?: boolean;
}): TRaPicker => {
  const indexes = new Map<number, TConsoleIndex>();

  return <T extends TRaCandidate>(
    raGame: TRaSet,
    candidates: T[]
  ): TRaPick<T> => {
    let index = indexes.get(raGame.consoleId);

    if (!index) {
      index = buildIndex(candidates, foldNumerals);
      indexes.set(raGame.consoleId, index);
    }

    const subject = toRaMatchSubject(
      raGame,
      slugsByConsole.get(raGame.consoleId) ?? [],
      foldNumerals
    );
    const result = resolveMatch(
      subject,
      findPool(subject, index),
      { platformSlugById, sharedTitles: new Set() },
      RA_MATCH_PROFILE
    );

    if (result.verdict === "absent") return { matches: [], ranked: [] };

    const variants = raTitleVariants(raGame.title);
    const original = (game: TMatchCandidate) =>
      index!.prepared.get(game) as unknown as T;
    const ranked = result.candidates
      .slice(0, RA_CONFLICT_CANDIDATES_LIMIT)
      .map((scored) => {
        const keys = gameTitleKeys(scored.game);

        return {
          game: original(scored.game),
          score: scored.score,
          matchedTitle:
            variants.find((variant) =>
              titleKeys(variant).some((key) => keys.has(key))
            ) ??
            variants[0] ??
            raGame.title,
          scored: { ...scored, game: original(scored.game) as never },
        };
      });

    return {
      matches: result.winner ? [original(result.winner)] : [],
      ranked,
      reason: result.reason,
    };
  };
};
