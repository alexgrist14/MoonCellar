import {
  ConflictSourceSchema,
  ConflictStateSchema,
  IConflictSource,
  IConflictState,
  IMatchReason,
} from "@mooncellar/schemas";

export const SOURCE_LABELS: Record<IConflictSource, string> = {
  vndb: "VNDB",
  igdb: "IGDB",
  hltb: "HLTB",
  ra: "RetroAchievements",
  steam: "Steam",
};

const EXTERNAL_URLS: Partial<Record<IConflictSource, (id: string) => string>> =
  {
    vndb: (id) => `https://vndb.org/${id}`,
    ra: (id) => `https://retroachievements.org/game/${id}`,
    steam: (id) => `https://store.steampowered.com/app/${id}`,
  };

export const externalUrl = (source: IConflictSource, externalId: string) =>
  EXTERNAL_URLS[source]?.(externalId) ?? null;

export const CONFLICT_SOURCES = ConflictSourceSchema.options;

export const parseConflictSource = (value: string | null) => {
  const parsed = ConflictSourceSchema.safeParse(value);

  return parsed.success ? parsed.data : undefined;
};

export const REASON_LABELS: Record<IMatchReason, string> = {
  "below-threshold": "No candidate scored high enough",
  "competing-candidates": "Candidates scored too close to call",
  "weak-title": "The titles only loosely match",
  "date-contradicts": "Release dates contradict each other",
  "genre-mismatch": "The game's genres rule out a visual novel",
  "description-mismatch": "The descriptions do not match",
  "no-company-evidence": "No shared developer or publisher",
  "company-mismatch": "Developers and publishers differ",
  "unverified-title": "Only the title matches",
  "custom-game": "Matches a game added by hand",
};

const CREATES_GAME: Record<IConflictSource, boolean> = {
  vndb: true,
  igdb: true,
  hltb: false,
  ra: false,
  steam: true,
};

const REOPENABLE: Record<IConflictSource, boolean> = {
  vndb: false,
  igdb: false,
  hltb: false,
  ra: true,
  steam: false,
};

export const isReopenable = (source: IConflictSource, state: string) =>
  REOPENABLE[source] && state === "new-game";

export const skipCaption = (source: IConflictSource) =>
  CREATES_GAME[source] ? "Adds it as a new game" : "Leaves it without a match";

const STATE_LABEL_SETS: Record<
  "create" | "link",
  Record<IConflictState, string>
> = {
  create: {
    waiting: "Waiting",
    "queued-match": "Match queued",
    "queued-new": "New game queued",
    matched: "Matched",
    "new-game": "New game",
    postponed: "Waits for release",
    dismissed: "Dismissed",
  },
  link: {
    waiting: "Waiting",
    "queued-match": "Match queued",
    "queued-new": "No match queued",
    matched: "Matched",
    "new-game": "No match",
    postponed: "Waits for release",
    dismissed: "Dismissed",
  },
};

export const stateLabel = (source: IConflictSource, state: IConflictState) =>
  STATE_LABEL_SETS[CREATES_GAME[source] ? "create" : "link"][state];

export const CONFLICT_STATES = ConflictStateSchema.options;

export const stateFilterLabel = (
  source: IConflictSource | undefined,
  state: IConflictState
) => {
  if (source) return stateLabel(source, state);

  const { create, link } = STATE_LABEL_SETS;

  return create[state] === link[state]
    ? create[state]
    : `${create[state]} / ${link[state]}`;
};

export const stateTone = (state: IConflictState) =>
  state === "waiting"
    ? "attention"
    : state === "matched" || state === "new-game"
      ? "positive"
      : "muted";
