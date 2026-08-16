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

export const normalizeCoreTitle = (value: string): string => {
  const normalized = normalizeTitle(value);
  let core = normalized;

  for (const pattern of EDITION_PATTERNS) {
    core = core.replace(pattern, " ");
  }

  core = core.trim().replace(/\s+/g, " ");

  return core || normalized;
};

/** Order-independent token-set similarity (Jaccard) in [0, 1]. */
export const titleSimilarity = (a: string, b: string): number =>
  jaccard(tokenSetFrom(normalizeTitle(a)), tokenSetFrom(normalizeTitle(b)));

export const jaccard = (a: Set<string>, b: Set<string>): number => {
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

export const tokenSetFrom = (value: string): Set<string> =>
  new Set(value.split(" ").filter(Boolean));

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
  new RegExp(
    `\\b(?:the )?(?:${EDITION_ADJECTIVES}) (?:edition|version)\\b`,
    "g"
  ),
  // "Director's Cut" — note normalizeTitle has already dropped the apostrophe.
  /\bdirectors? cut\b/g,
  // Standalone trailing markers that appear without the word "edition".
  /\b(?:remastered|remaster|redux|goty|deluxe|enhanced|hd)\b/g,
  // HLTB sometimes suffixes DLC entries with "DLC".
  /\bdlc\b/g,
];
