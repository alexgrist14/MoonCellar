import type { ICompanyField } from "@mooncellar/schemas";
import { parsePartialDate } from "../../../shared/release-date";
import { MIN_STRING_LENGTH, MIN_TITLE_WORDS } from "../constants/vndb";
import {
  descriptionOverlap,
  descriptionTokens,
  isSameCompanyName,
  jaccard,
  normalizeTitle,
  titleKey,
  titleKeyVariants,
  tokenSetFrom,
} from "../utils/title-match.utils";
import type {
  IMatchContext,
  IMatchProfile,
  IMatchResult,
  IMatchSubject,
  IScoreBreakdown,
  IScoredCandidate,
  TDateSignal,
  TDescriptionSignal,
  TMatchCandidate,
  TMatchReason,
} from "./game-matcher.types";

export const MATCH_CANDIDATE_PROJECTION = {
  name: 1,
  slug: 1,
  nameNormalized: 1,
  type: 1,
  genres: 1,
  first_release: 1,
  release_dates: 1,
  alternative_names: 1,
  companies: 1,
  platformIds: 1,
  summary: 1,
  isCustom: 1,
};

type TMatchedTitle = { key: string; isExact: boolean };

export const isStrongTitle = (normalized: string) =>
  normalized.length >= MIN_STRING_LENGTH || normalized.split(" ").length > 1;

const titleKeyMap = (rawTitles: string[]): Map<string, boolean> => {
  const keys = new Map<string, boolean>();

  for (const raw of rawTitles) {
    const key = titleKey(raw);
    if (!key) continue;

    keys.set(key, true);
    for (const variant of titleKeyVariants(raw)) {
      if (!keys.has(variant)) keys.set(variant, false);
    }
  }

  return keys;
};

export const gameTitleKeys = (game: TMatchCandidate): Set<string> =>
  new Set(titleKeyMap([game.name, ...(game.alternative_names ?? [])]).keys());

const matchedTitles = (
  subject: IMatchSubject,
  game: TMatchCandidate
): TMatchedTitle[] => {
  const gameKeys = titleKeyMap([game.name, ...(game.alternative_names ?? [])]);
  const subjectKeys = titleKeyMap([subject.name, ...subject.alternativeNames]);

  const matched: TMatchedTitle[] = [];

  for (const [key, isSubjectPrimary] of subjectKeys) {
    const isGamePrimary = gameKeys.get(key);
    if (isGamePrimary === undefined) continue;

    matched.push({ key, isExact: isSubjectPrimary && isGamePrimary });
  }

  return matched;
};

export const isSimilarTitle = (
  subject: IMatchSubject,
  game: TMatchCandidate,
  threshold: number
): boolean => {
  const toTokenSets = (titles: string[]) =>
    titles
      .map(normalizeTitle)
      .filter(Boolean)
      .map(tokenSetFrom)
      .filter((set) => set.size);

  const subjectTitles = toTokenSets([
    subject.name,
    ...subject.alternativeNames,
  ]);
  const gameTitles = toTokenSets([
    game.name,
    ...(game.alternative_names ?? []),
  ]);

  return subjectTitles.some((subjectTokens) =>
    gameTitles.some(
      (gameTokens) => jaccard(subjectTokens, gameTokens) >= threshold
    )
  );
};

const isDistinctiveTitle = (title: string, sharedTitles: Set<string>) =>
  !sharedTitles.has(title) &&
  title.length >= MIN_STRING_LENGTH &&
  title.split(" ").length >= MIN_TITLE_WORDS;

const isMainTitleMatch = (
  subject: IMatchSubject,
  game: TMatchCandidate,
  titles: TMatchedTitle[]
) => {
  const subjectMainKeys = new Set(
    [subject.name, subject.originalName].map(titleKey).filter(Boolean)
  );
  const gameMainKey = titleKey(game.name);

  return titles.some(
    ({ key, isExact }) =>
      isExact && key === gameMainKey && subjectMainKeys.has(key)
  );
};

const titleMatchScore = (
  titles: TMatchedTitle[],
  sharedTitles: Set<string>,
  profile: IMatchProfile
) => {
  let bestScore = 0;

  for (const { key, isExact } of titles) {
    const tier = isDistinctiveTitle(key, sharedTitles)
      ? profile.title.distinctive
      : isStrongTitle(key)
        ? profile.title.strong
        : profile.title.weak;

    const points = isExact ? tier : Math.min(tier, profile.title.strong);

    if (points > bestScore) bestScore = points;
  }

  return bestScore;
};

const companyMatchScore = (
  subject: IMatchSubject,
  game: TMatchCandidate,
  profile: IMatchProfile
) => {
  const companies = game.companies ?? [];
  if (!companies.length) return 0;

  const roleScore = (
    names: string[],
    hasRole: (company: ICompanyField) => boolean
  ) => {
    if (!names.length) return 0;

    const matched = companies.filter((company) =>
      names.some((name) => isSameCompanyName(name, company.name))
    );
    if (!matched.length) return 0;

    return matched.some(hasRole) ? profile.company.role : profile.company.any;
  };

  return (
    roleScore(
      subject.developers,
      ({ developer, porting, supporting }) => developer || porting || supporting
    ) + roleScore(subject.publishers, ({ publisher }) => publisher)
  );
};

const hasCompanyMismatch = (subject: IMatchSubject, game: TMatchCandidate) => {
  const companies = game.companies ?? [];
  const names = [...subject.developers, ...subject.publishers];

  if (!companies.length || !names.length) return false;

  return !companies.some(({ name }) =>
    names.some((subjectName) => isSameCompanyName(subjectName, name))
  );
};

const platformMatchScore = (
  subject: IMatchSubject,
  game: TMatchCandidate,
  platformSlugById: Map<string, string>,
  profile: IMatchProfile
) => {
  const subjectSlugs = new Set(subject.platformSlugs);
  const gameSlugs = (game.platformIds ?? [])
    .map((id) => platformSlugById.get(String(id)))
    .filter((slug): slug is string => !!slug);

  if (!subjectSlugs.size || !gameSlugs.length) return 0;

  return gameSlugs.some((slug) => subjectSlugs.has(slug))
    ? profile.platform.match
    : profile.platform.mismatch;
};

const genreMatchScore = (game: TMatchCandidate, profile: IMatchProfile) => {
  const genres = game.genres ?? [];
  if (!profile.genre || !genres.length) return 0;

  if (genres.includes(profile.genre.expected)) return profile.genre.score;

  return genres.some((genre) => profile.genre.incompatible.includes(genre))
    ? profile.genre.incompatibleScore
    : 0;
};

const isCloseDate = (a: Date, b: Date, maxDiffDays: number) => {
  if (Math.abs(a.getUTCFullYear() - b.getUTCFullYear()) <= 1) return true;

  return Math.abs(+a - +b) / (1000 * 60 * 60 * 24) <= maxDiffDays;
};

const compareDates = (
  subjectDates: string[],
  game: TMatchCandidate,
  profile: IMatchProfile
): TDateSignal => {
  const subjectParsed = subjectDates
    .map((date) => parsePartialDate(date))
    .filter((date): date is Date => !!date);

  const gameParsed = [
    game.first_release,
    ...(game.release_dates ?? []).map(({ date }) => date),
  ]
    .filter((timestamp): timestamp is number => !!timestamp)
    .map((timestamp) => new Date(timestamp * 1000));

  if (!subjectParsed.length || !gameParsed.length) return "unknown";

  const isConfirmed = subjectParsed.some((subjectDate) =>
    gameParsed.some((gameDate) =>
      isCloseDate(subjectDate, gameDate, profile.date.maxDiffDays)
    )
  );

  return isConfirmed ? "confirms" : "contradicts";
};

const compareDescriptions = (
  subject: IMatchSubject,
  game: TMatchCandidate,
  profile: IMatchProfile
): TDescriptionSignal => {
  const titleTokens = descriptionTokens(
    [
      subject.name,
      ...subject.alternativeNames,
      game.name,
      ...(game.alternative_names ?? []),
    ].join(" ")
  );
  const subjectTokens = descriptionTokens(
    subject.description ?? "",
    titleTokens
  );
  const gameTokens = descriptionTokens(game.summary ?? "", titleTokens);

  if (
    subjectTokens.size < profile.description.minTokens ||
    gameTokens.size < profile.description.minTokens
  ) {
    return "unknown";
  }

  const sharedCount = [...subjectTokens].filter((token) =>
    gameTokens.has(token)
  ).length;

  return sharedCount >= profile.description.minShared &&
    descriptionOverlap(subjectTokens, gameTokens) >=
      profile.description.similarity
    ? "match"
    : "mismatch";
};

const scoreCandidate = (
  subject: IMatchSubject,
  game: TMatchCandidate,
  { platformSlugById, sharedTitles }: IMatchContext,
  profile: IMatchProfile
): IScoredCandidate => {
  const dateSignal = compareDates(subject.releaseDates, game, profile);
  const titles = matchedTitles(subject, game);
  const isCompanyMismatch = hasCompanyMismatch(subject, game);

  const breakdown: IScoreBreakdown = {
    date:
      dateSignal === "confirms"
        ? profile.date.confirms
        : dateSignal === "contradicts"
          ? profile.date.contradicts
          : 0,
    genre: genreMatchScore(game, profile),
    type: profile.typeScore(subject.type, game.type),
    title: titles.length
      ? titleMatchScore(titles, sharedTitles, profile)
      : isSimilarTitle(subject, game, profile.title.fuzzySimilarity)
        ? profile.title.weak
        : 0,
    companies:
      companyMatchScore(subject, game, profile) +
      (isCompanyMismatch ? profile.company.mismatch : 0),
    platforms: platformMatchScore(subject, game, platformSlugById, profile),
  };

  const score = Object.values(breakdown).reduce((sum, part) => sum + part, 0);

  return {
    game,
    score,
    dateSignal,
    breakdown,
    isDistinctiveTitle: titles.some(
      ({ key, isExact }) => isExact && isDistinctiveTitle(key, sharedTitles)
    ),
    isMainTitleMatch: isMainTitleMatch(subject, game, titles),
    isCorroborated: breakdown.date > 0 || breakdown.companies > 0,
    isContradicted: dateSignal === "contradicts",
    hasCompanyMismatch: isCompanyMismatch,
    descriptionSignal: compareDescriptions(subject, game, profile),
  };
};

const getRejectionReason = (
  candidate: IScoredCandidate,
  profile: IMatchProfile
): TMatchReason | null => {
  if (candidate.breakdown.title < profile.title.strong) return "weak-title";
  if (candidate.isContradicted) return "date-contradicts";
  if (candidate.breakdown.genre < 0) return "genre-mismatch";

  if (
    candidate.breakdown.companies <= 0 &&
    candidate.descriptionSignal !== "match"
  ) {
    return candidate.descriptionSignal === "mismatch"
      ? "description-mismatch"
      : "no-company-evidence";
  }

  if (
    candidate.hasCompanyMismatch &&
    (!candidate.isDistinctiveTitle || !candidate.isMainTitleMatch)
  ) {
    return "company-mismatch";
  }

  if (candidate.isCorroborated) return null;

  return candidate.isDistinctiveTitle &&
    candidate.isMainTitleMatch &&
    !candidate.hasCompanyMismatch
    ? null
    : "unverified-title";
};

export const resolveMatch = (
  subject: IMatchSubject,
  candidates: TMatchCandidate[],
  context: IMatchContext,
  profile: IMatchProfile
): IMatchResult => {
  const gamesByTitle = new Map<string, number>();

  for (const game of candidates) {
    for (const key of gameTitleKeys(game)) {
      gamesByTitle.set(key, (gamesByTitle.get(key) ?? 0) + 1);
    }
  }

  const sharedTitles = new Set([
    ...context.sharedTitles,
    ...[...gamesByTitle].filter(([, count]) => count > 1).map(([key]) => key),
  ]);

  const scored = candidates
    .map((game) =>
      scoreCandidate(subject, game, { ...context, sharedTitles }, profile)
    )
    .sort((a, b) => b.score - a.score);

  const viable = scored.filter(({ score }) => score >= profile.threshold);

  if (!viable.length) {
    return {
      verdict: "absent",
      reason: scored.length ? "below-threshold" : null,
      winner: null,
      candidates: scored,
    };
  }

  const [best, runnerUp] = viable;

  const isUnique = !runnerUp || best.score - runnerUp.score >= profile.gap;
  const rejection = isUnique
    ? getRejectionReason(best, profile)
    : "competing-candidates";
  const reason =
    rejection ??
    (profile.reviewCustomGames && viable.some(({ game }) => game.isCustom)
      ? "custom-game"
      : null);

  return {
    verdict: reason ? "ambiguous" : "matched",
    reason,
    winner: reason ? null : best.game,
    candidates: scored,
  };
};
