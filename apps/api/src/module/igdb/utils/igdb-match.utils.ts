import type {
  IMatchResult,
  TMatchCandidate,
} from "../../games/matching/game-matcher.types";

export const IGDB_CONFLICT_CANDIDATES_LIMIT = 10;

export const withoutOtherIgdbGames = <T extends Pick<TMatchCandidate, "_id">>(
  candidates: T[],
  linkedIgdbIds: Map<string, number>,
  igdbId: number
) =>
  candidates.filter((candidate) => {
    const linkedId = linkedIgdbIds.get(String(candidate._id));

    return linkedId === undefined || linkedId === igdbId;
  });

export const isConfirmedIgdbMatch = (result: IMatchResult) => {
  const [winner, ...rest] = result.candidates;

  return (
    result.verdict === "matched" &&
    !!result.winner &&
    !!winner &&
    !rest.length &&
    winner.breakdown.title > 0 &&
    winner.breakdown.companies > 0 &&
    winner.dateSignal === "confirms"
  );
};
