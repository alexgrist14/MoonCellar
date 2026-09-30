import type mongoose from "mongoose";
import type {
  IDateSignal,
  IDescriptionSignal,
  IMatchReason,
  IScoreBreakdown as ISharedScoreBreakdown,
} from "@mooncellar/schemas";
import type { Game } from "../schemas/game.schema";

export type TMatchCandidate = Pick<
  Game,
  | "name"
  | "slug"
  | "nameNormalized"
  | "type"
  | "genres"
  | "first_release"
  | "release_dates"
  | "alternative_names"
  | "companies"
  | "platformIds"
  | "summary"
  | "isCustom"
> & { _id: mongoose.Types.ObjectId };

export interface IMatchSubject {
  id: string;
  name: string;
  originalName: string;
  alternativeNames: string[];
  type: string;
  releaseDates: string[];
  developers: string[];
  publishers: string[];
  platformSlugs: string[];
  description: string;
}

export interface IMatchProfile {
  threshold: number;
  gap: number;
  title: {
    distinctive: number;
    strong: number;
    weak: number;
    fuzzySimilarity: number;
  };
  company: { role: number; any: number; mismatch: number };
  date: { confirms: number; contradicts: number; maxDiffDays: number };
  genre: {
    expected: string;
    score: number;
    incompatible: string[];
    incompatibleScore: number;
  } | null;
  platform: { match: number; mismatch: number };
  description: { minTokens: number; minShared: number; similarity: number };
  typeScore: (subjectType: string, gameType: string) => number;
  reviewCustomGames: boolean;
}

export interface IMatchContext {
  platformSlugById: Map<string, string>;
  sharedTitles: Set<string>;
}

export type TMatchVerdict = "matched" | "ambiguous" | "absent";
export type TMatchReason = IMatchReason;
export type TDateSignal = IDateSignal;
export type TDescriptionSignal = IDescriptionSignal;
export type IScoreBreakdown = ISharedScoreBreakdown;

export interface IScoredCandidate {
  game: TMatchCandidate;
  score: number;
  dateSignal: TDateSignal;
  breakdown: IScoreBreakdown;
  isDistinctiveTitle: boolean;
  isMainTitleMatch: boolean;
  isCorroborated: boolean;
  isContradicted: boolean;
  hasCompanyMismatch: boolean;
  descriptionSignal: TDescriptionSignal;
}

export interface IMatchResult {
  verdict: TMatchVerdict;
  reason: TMatchReason | null;
  winner: TMatchCandidate | null;
  candidates: IScoredCandidate[];
}

export interface ICandidateSearch {
  candidatesBySubject: Map<string, TMatchCandidate[]>;
  sharedTitles: Set<string>;
}
