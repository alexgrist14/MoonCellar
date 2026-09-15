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

const COMPANY_SUFFIX_PATTERN =
  /\b(?:co|company|corp|corporation|inc|incorporated|ltd|limited|llc|kk|gmbh|plc|sa|srl|bv|ab|oy|pte|pty)\b/g;

const MIN_TITLE_KEY_LENGTH = 3;
const MIN_TITLE_KEY_RATIO = 0.75;
const MIN_COMPANY_KEY_LENGTH = 5;

export const normalizeCompanyName = (value: string): string =>
  normalizeTitle(value)
    .replace(COMPANY_SUFFIX_PATTERN, " ")
    .replace(/\s+/g, "");

export const companySearchPrefix = (value: string): string =>
  normalizeTitle(value)
    .replace(COMPANY_SUFFIX_PATTERN, " ")
    .replace(/\s+/g, " ")
    .trim();

const sortedCompanyTokens = (value: string): string =>
  normalizeTitle(value)
    .replace(COMPANY_SUFFIX_PATTERN, " ")
    .split(" ")
    .filter(Boolean)
    .sort()
    .join("");

export const isSameCompanyName = (a: string, b: string): boolean => {
  const [compactA, compactB] = [
    normalizeCompanyName(a),
    normalizeCompanyName(b),
  ];
  if (!compactA || !compactB) return false;
  if (compactA === compactB) return true;

  if (sortedCompanyTokens(a) === sortedCompanyTokens(b)) return true;

  return (
    compactA.length >= MIN_COMPANY_KEY_LENGTH &&
    compactB.length >= MIN_COMPANY_KEY_LENGTH &&
    (compactA.includes(compactB) || compactB.includes(compactA))
  );
};

const isReliableTitleKey = (raw: string, normalized: string): boolean => {
  if (!normalized) return false;

  const rawLength = (raw.match(/[\p{L}\p{N}]/gu) ?? []).length;
  const keyLength = normalized.replace(/ /g, "").length;

  return (
    keyLength >= MIN_TITLE_KEY_LENGTH &&
    keyLength >= rawLength * MIN_TITLE_KEY_RATIO
  );
};

export const titleKey = (raw: string): string => {
  const value = raw ?? "";
  const normalized = normalizeTitle(value);

  return isReliableTitleKey(value, normalized)
    ? normalized
    : value.normalize("NFKC").toLowerCase().replace(/\s+/g, "");
};

const PARTICLE_REPLACEMENTS: [RegExp, string][] = [
  [/\bwo\b/g, "o"],
  [/\bhe\b/g, "e"],
  [/\bha\b/g, "wa"],
  [/\bdu\b/g, "zu"],
];

const sortTokens = (value: string): string =>
  value.split(" ").filter(Boolean).sort().join(" ");

const canonicalRomaji = (normalized: string): string => {
  let value = normalized;

  for (const [pattern, replacement] of PARTICLE_REPLACEMENTS) {
    value = value.replace(pattern, replacement);
  }

  return value
    .replace(/ou/g, "o")
    .replace(/([aeiou])\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
};

export const titleKeyVariants = (raw: string): string[] => {
  const value = raw ?? "";
  const normalized = normalizeTitle(value);
  if (!isReliableTitleKey(value, normalized)) return [];

  const romaji = canonicalRomaji(normalized);

  return [
    ...new Set([
      normalized.replace(/ /g, ""),
      sortTokens(normalized),
      romaji,
      romaji.replace(/ /g, ""),
      sortTokens(romaji),
    ]),
  ].filter((key) => key !== normalized && key.length >= MIN_TITLE_KEY_LENGTH);
};

const DESCRIPTION_STOP_WORDS = new Set([
  "about",
  "after",
  "again",
  "against",
  "also",
  "another",
  "around",
  "because",
  "been",
  "before",
  "being",
  "between",
  "both",
  "came",
  "come",
  "could",
  "days",
  "does",
  "down",
  "during",
  "each",
  "even",
  "ever",
  "every",
  "from",
  "game",
  "games",
  "girl",
  "girls",
  "goes",
  "going",
  "gone",
  "have",
  "having",
  "here",
  "himself",
  "however",
  "into",
  "just",
  "know",
  "life",
  "like",
  "long",
  "made",
  "make",
  "many",
  "more",
  "most",
  "much",
  "must",
  "never",
  "next",
  "novel",
  "novels",
  "once",
  "only",
  "other",
  "over",
  "own",
  "player",
  "players",
  "same",
  "she",
  "should",
  "since",
  "some",
  "something",
  "story",
  "such",
  "than",
  "that",
  "their",
  "them",
  "then",
  "there",
  "these",
  "they",
  "thing",
  "things",
  "this",
  "those",
  "through",
  "time",
  "under",
  "until",
  "upon",
  "very",
  "visual",
  "want",
  "well",
  "were",
  "what",
  "when",
  "where",
  "which",
  "while",
  "who",
  "will",
  "with",
  "without",
  "world",
  "would",
  "your",
]);

const stripMarkup = (value: string): string =>
  (value ?? "")
    .replace(/\[url=[^\]]*\]/gi, " ")
    .replace(/\[\/?[a-z]+[^\]]*\]/gi, " ")
    .replace(/<[^>]+>/g, " ");

export const descriptionTokens = (value: string): Set<string> =>
  new Set(
    normalizeTitle(stripMarkup(value))
      .split(" ")
      .filter(
        (token) => token.length >= 4 && !DESCRIPTION_STOP_WORDS.has(token)
      )
  );

export const descriptionOverlap = (a: Set<string>, b: Set<string>): number => {
  if (!a.size || !b.size) return 0;

  let intersection = 0;
  for (const token of a) {
    if (b.has(token)) intersection += 1;
  }

  return intersection / Math.min(a.size, b.size);
};

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
