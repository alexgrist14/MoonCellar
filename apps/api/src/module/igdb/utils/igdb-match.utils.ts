import type {
  IMatchResult,
  IMatchSubject,
  TMatchCandidate,
} from "../../games/matching/game-matcher.types";
import { categoryTypeNames } from "../constants/common";

export const IGDB_CONFLICT_CANDIDATES_LIMIT = 10;

export type TIgdbMatchSource = {
  id: number;
  name: string;
  category?: number;
  summary?: string;
  first_release_date?: number;
  alternative_names?: { name: string }[];
  game_type?: { type: string };
  involved_companies?: {
    company?: { name: string };
    developer: boolean;
    publisher: boolean;
    porting: boolean;
    supporting: boolean;
  }[];
};

export const toIgdbMatchSubject = (
  igdbGame: TIgdbMatchSource,
  platformSlugs: string[]
): IMatchSubject => {
  const companies = igdbGame.involved_companies || [];
  const namesOf = (isRole: (company: (typeof companies)[number]) => boolean) =>
    companies
      .filter(isRole)
      .map(({ company }) => company?.name)
      .filter((name): name is string => !!name);

  return {
    id: String(igdbGame.id),
    name: igdbGame.name,
    originalName: igdbGame.name,
    alternativeNames: (igdbGame.alternative_names || []).map(
      ({ name }) => name
    ),
    type:
      igdbGame.game_type?.type ||
      (igdbGame.category !== undefined
        ? categoryTypeNames[igdbGame.category]
        : undefined) ||
      "",
    releaseDates: igdbGame.first_release_date
      ? [
          new Date(igdbGame.first_release_date * 1000)
            .toISOString()
            .slice(0, 10),
        ]
      : [],
    developers: namesOf(
      ({ developer, porting, supporting }) =>
        !!(developer || porting || supporting)
    ),
    publishers: namesOf(({ publisher }) => !!publisher),
    platformSlugs,
    description: igdbGame.summary ?? "",
  };
};

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
