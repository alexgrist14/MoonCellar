import { GAME_STATUSES } from "@mooncellar/schemas";
import { BadgeTone } from "@/src/lib/shared/ui/Badge";

const TONES: Partial<Record<(typeof GAME_STATUSES)[number], BadgeTone>> = {
  Alpha: "attention",
  Beta: "attention",
  "Early Access": "attention",
  Offline: "negative",
  Cancelled: "negative",
  Delisted: "negative",
  Rumored: "muted",
};

export const getGameStatusTone = (status: string): BadgeTone | undefined =>
  TONES[status as (typeof GAME_STATUSES)[number]];
