import type { BadgeTone } from "@/src/lib/shared/ui/Badge";
import {
  ConflictSourceSchema,
  ConflictStateSchema,
  IConflictAiVerdict,
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
    hltb: (id) => `https://howlongtobeat.com/game/${id}`,
    ra: (id) => `https://retroachievements.org/game/${id}`,
    steam: (id) => `https://store.steampowered.com/app/${id}`,
  };

export const externalUrl = (source: IConflictSource, externalId: string) =>
  EXTERNAL_URLS[source]?.(externalId) ?? null;

const SERVER_BLOCKED_IMAGE_HOSTS = ["howlongtobeat.com"];

export const isServerBlockedImage = (src: string) =>
  SERVER_BLOCKED_IMAGE_HOSTS.some((host) => new URL(src).hostname === host);

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

const STATE_LABELS: Record<IConflictState, string> = {
  waiting: "Waiting",
  "queued-match": "Match queued",
  "queued-new": "New game queued",
  matched: "Matched",
  "new-game": "New game",
  skipped: "No game added",
  postponed: "Waits for release",
  dismissed: "Dismissed",
};

export const stateLabel = (state: IConflictState) => STATE_LABELS[state];

export const CONFLICT_STATES = ConflictStateSchema.options;

export const stateTone = (state: IConflictState) =>
  state === "waiting"
    ? "attention"
    : state === "matched" || state === "new-game"
      ? "positive"
      : "muted";

export const aiVerdictTone = (verdict: IConflictAiVerdict): BadgeTone =>
  verdict.undoneAt || !verdict.gameIds.length
    ? "muted"
    : AI_CONFIDENCE_TONES[verdict.confidence];

export const AI_CONFIDENCE_TONES: Record<
  IConflictAiVerdict["confidence"],
  BadgeTone
> = {
  high: "positive",
  medium: "attention",
  low: "muted",
};
