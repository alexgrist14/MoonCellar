import { normalizeTitle } from "../../games/utils/title-match.utils";

export interface ISteamMatchCandidate<T> {
  id: T;
  name?: string | null;
  versionTitle?: string | null;
  type?: string | null;
}

const MAIN_GAME_TYPE = "Main Game";

const rankCandidate = (
  candidate: ISteamMatchCandidate<unknown>,
  steamName: string
) =>
  (normalizeTitle(candidate.name ?? "") === steamName ? 4 : 0) +
  (candidate.versionTitle ? 0 : 2) +
  (candidate.type === MAIN_GAME_TYPE ? 1 : 0);

export const pickSteamCandidate = <T>(
  candidates: ISteamMatchCandidate<T>[],
  steamName?: string
): T | null => {
  const normalized = normalizeTitle(steamName ?? "");
  let best: ISteamMatchCandidate<T> | null = null;
  let bestRank = -1;

  for (const candidate of candidates) {
    const rank = rankCandidate(candidate, normalized);

    if (rank > bestRank) {
      best = candidate;
      bestRank = rank;
    }
  }

  return best?.id ?? null;
};
