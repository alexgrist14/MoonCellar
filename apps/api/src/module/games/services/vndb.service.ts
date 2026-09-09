import { HttpService } from "@nestjs/axios";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { firstValueFrom } from "rxjs";
import { Game, GameDocument } from "../schemas/game.schema";
import mongoose, { Model, Types } from "mongoose";
import {
  IScoredCandidate,
  IVndbGameResponse,
  IVndbNovel,
  IVndbReleaseResponse,
  IVnMatch,
  IScoreBreakdown,
  IScoreContext,
  TCandidatesByVn,
  TDateSignal,
  TDescriptionSignal,
  TMatchReason,
  TReleaseSignalsByVn,
  TVndbCandidate,
  TVndbFilter,
  TVndbFilters,
} from "../interface/vndb.interface";
import {
  companySearchPrefix,
  descriptionOverlap,
  descriptionTokens,
  isSameCompanyName,
  jaccard,
  normalizeTitle,
  titleKey,
  titleKeyVariants,
  tokenSetFrom,
} from "../utils/title-match.utils";
import { ICompanyField } from "@mooncellar/schemas";
import {
  INCOMPATIBLE_GENRES,
  MAIN_GAME_TYPE,
  MIN_COMPANY_PREFIX_LENGTH,
  MIN_DESCRIPTION_TOKENS,
  MIN_STRING_LENGTH,
  MIN_TITLE_WORDS,
  REEDITION_TYPES,
  VISUAL_NOVEL_GENRE,
  VNDB_ANY_COMPANY_SCORE,
  VNDB_COMPANY_MISMATCH_SCORE,
  VNDB_DESCRIPTION_SIMILARITY,
  VNDB_FALLBACK_COMPANY_CHUNK_SIZE,
  VNDB_FALLBACK_TITLE_SIMILARITY,
  VNDB_FUZZY_TITLE_SIMILARITY,
  VNDB_MAX_RETRIES,
  VNDB_REQUEST_DELAY_MS,
  VNDB_RETRY_DELAY_MS,
  VNDB_DISTINCTIVE_TITLE_SCORE,
  VNDB_STRONG_TITLE_SCORE,
  VNDB_WEAK_TITLE_SCORE,
  VNDB_DATE_CONFIRMS_SCORE,
  VNDB_DATE_CONTRADICTS_SCORE,
  VNDB_DATE_MAX_DIFF_DAYS,
  VNDB_GENRE_SCORE,
  VNDB_INCOMPATIBLE_GENRE_SCORE,
  VNDB_PLATFORM_MATCH_SCORE,
  VNDB_PLATFORM_MISMATCH_SCORE,
  VNDB_PLATFORM_SLUGS,
  VNDB_RELEASE_ID_CHUNK_SIZE,
  VNDB_RELEASE_PAGE_SIZE,
  VNDB_ROLE_COMPANY_SCORE,
  VNDB_SCORE_GAP,
  VNDB_SCORE_THRESHOLD,
} from "../constants/vndb";
import { VndbCandidate } from "../schemas/vndb-candidates.schema";
import { Platform } from "../schemas/platform.schema";
import { sleep } from "../../../shared/utils";

const VNDB_API_URL = "https://api.vndb.org/kana";

const isStrongTitle = (normalized: string) =>
  normalized.length >= MIN_STRING_LENGTH || normalized.split(" ").length > 1;

const CANDIDATE_PROJECTION = {
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
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@Injectable()
export class VndbService {
  private readonly logger = new Logger(VndbService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    @InjectModel(VndbCandidate.name)
    private readonly vndbCandidatesModel: Model<VndbCandidate>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<Platform>
  ) {}

  async getStats() {
    const { data } = await firstValueFrom(
      this.httpService.get<IVndbGameResponse[]>(`${VNDB_API_URL}/stats`)
    );
    return data;
  }

  async searchVn(title: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<IVndbGameResponse>(`${VNDB_API_URL}/vn`, {
          filters: ["search", "=", title],
          fields: "title,titles.title,titles.lang",
        })
      );

      const exactMatch = data.results.filter((vn) => vn.title === title);
      console.log(exactMatch);

      return data.results[0];
    } catch (error) {
      console.log(error);
      this.logger.debug(error);
    }
  }

  async backFill() {
    let page = 1;

    while (true) {
      const data = await this.post<IVndbGameResponse>("/vn", { page });
      const matches = await this.getVnMatches(data);
      await sleep(3000);
      if (data.more) {
        page++;
      } else {
        break;
      }
      console.log(matches);
    }
  }

  private async getVnMatches(data: IVndbGameResponse): Promise<IVnMatch[]> {
    const searchIdsFilters: TVndbFilter[] = data.results.map(({ id }) => [
      "id",
      "=",
      id,
    ]);

    const novelsResponse = await this.post<IVndbGameResponse>("/vn", {
      filters: ["or", ...searchIdsFilters] satisfies TVndbFilters,
      fields:
        "title,alttitle,titles.title,titles.lang,titles.latin,titles.official,titles.main,released,platforms,description,developers.name,developers.original,developers.aliases",
    });

    const vndbTitles = novelsResponse.results.map((vn) => this.getTitles(vn));

    const vnIdsByKey = new Map<string, Set<string>>();
    const strongKeys: string[] = [];
    const rawNames: string[] = [];

    for (const vn of vndbTitles) {
      for (const raw of [vn.name, ...vn.alternativeNames]) {
        rawNames.push(raw);
        const key = titleKey(raw);
        if (!key) continue;

        for (const candidateKey of [key, ...titleKeyVariants(raw)]) {
          if (isStrongTitle(candidateKey) || raw === vn.name) {
            strongKeys.push(candidateKey);
          }

          const set = vnIdsByKey.get(candidateKey) ?? new Set();
          set.add(vn.id);
          vnIdsByKey.set(candidateKey, set);
        }
      }
    }

    const existingGames = await this.gamesModel
      .find(
        {
          $or: [
            {
              nameNormalized: {
                $in: [...new Set(strongKeys)],
              },
            },
            {
              name: {
                $in: [...new Set(rawNames)],
              },
            },
            {
              alternative_names: {
                $in: [...new Set(rawNames)],
              },
            },
          ],
        },
        CANDIDATE_PROJECTION
      )
      .lean();

    const candidatesByVn: TCandidatesByVn = new Map();

    const addCandidate = (vnId: string, game: TVndbCandidate) => {
      const list = candidatesByVn.get(vnId) ?? [];
      if (list.some((g) => String(g._id) === String(game._id))) return;
      list.push(game);
      candidatesByVn.set(vnId, list);
    };

    for (const game of existingGames) {
      const gameTitles = this.gameTitleKeys(game);

      for (const [key, vnIds] of vnIdsByKey) {
        if (!gameTitles.has(key)) continue;

        for (const vnId of vnIds) addCandidate(vnId, game);
      }
    }

    const fallbackByVn = await this.findCandidatesByCompany(
      vndbTitles.filter((vn) => !candidatesByVn.has(vn.id))
    );

    for (const [vnId, games] of fallbackByVn) {
      for (const game of games) addCandidate(vnId, game);
    }

    const [signalsByVn, platformSlugById] = await Promise.all([
      this.fetchReleaseSignals([...candidatesByVn.keys()]),
      this.getPlatformSlugs(),
    ]);

    const enrichedTitles = vndbTitles.map((vn) => {
      const signals = signalsByVn.get(vn.id);

      return {
        ...vn,
        publishers: signals?.publishers ?? [],
        releaseDates: [
          ...new Set([...vn.releaseDates, ...(signals?.releaseDates ?? [])]),
        ],
        platforms: [
          ...new Set([...vn.platforms, ...(signals?.platforms ?? [])]),
        ],
      };
    });

    const sharedTitles = new Set(
      [...vnIdsByKey].filter(([, vnIds]) => vnIds.size > 1).map(([key]) => key)
    );

    const matches = this.matchNovels(enrichedTitles, candidatesByVn, {
      platformSlugById,
      sharedTitles,
    });
    const candidatesForMatch = matches.filter(
      ({ verdict }) => verdict === "ambiguous"
    );

    try {
      await this.vndbCandidatesModel.insertMany(
        candidatesForMatch.map(({ vnId, vnName, reason, candidates }) => ({
          vnId,
          vnName,
          reason,
          candidates: candidates.map((candidate) => ({
            gameId: new Types.ObjectId(candidate.game._id),
            slug: candidate.game.slug,
            name: candidate.game.name,
            score: candidate.score,
            breakdown: candidate.breakdown,
            dateSignal: candidate.dateSignal,
            descriptionSignal: candidate.descriptionSignal,
            hasCompanyMismatch: candidate.hasCompanyMismatch,
          })),
          status: "pending",
          winner: null,
        })),
        { ordered: false }
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }

    return matches;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      try {
        const { data } = await firstValueFrom(
          this.httpService.post<T>(`${VNDB_API_URL}${path}`, body)
        );

        return data;
      } catch (error) {
        const status = (error as { response?: { status?: number } }).response
          ?.status;

        if (status !== 429 || attempt >= VNDB_MAX_RETRIES) throw error;

        this.logger.warn(
          `VNDB throttled ${path}, retry ${attempt + 1}/${VNDB_MAX_RETRIES}`
        );
        await sleep(VNDB_RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  private async findCandidatesByCompany(
    vns: IVndbTitles[]
  ): Promise<TCandidatesByVn> {
    const result: TCandidatesByVn = new Map();
    const prefixes = [
      ...new Set(
        vns
          .flatMap(({ developers }) => developers)
          .map(companySearchPrefix)
          .filter((name) => name.length >= MIN_COMPANY_PREFIX_LENGTH)
      ),
    ];

    if (!prefixes.length) return result;

    const gamesById = new Map<string, TVndbCandidate>();

    for (
      let i = 0;
      i < prefixes.length;
      i += VNDB_FALLBACK_COMPANY_CHUNK_SIZE
    ) {
      const chunk = prefixes.slice(i, i + VNDB_FALLBACK_COMPANY_CHUNK_SIZE);

      const found = await this.gamesModel
        .find(
          {
            "companies.name": {
              $in: chunk.map(
                (prefix) => new RegExp(`^${escapeRegExp(prefix)}`, "i")
              ),
            },
          },
          CANDIDATE_PROJECTION
        )
        .lean();

      for (const game of found) gamesById.set(String(game._id), game);
    }

    for (const game of gamesById.values()) {
      for (const vn of vns) {
        const isSameStudio = (game.companies ?? []).some(({ name }) =>
          vn.developers.some((developer) => isSameCompanyName(developer, name))
        );
        if (!isSameStudio) continue;
        if (!this.isSimilarTitle(vn, game, VNDB_FALLBACK_TITLE_SIMILARITY))
          continue;

        result.set(vn.id, [...(result.get(vn.id) ?? []), game]);
      }
    }

    return result;
  }

  private async getPlatformSlugs(): Promise<Map<string, string>> {
    const platforms = await this.platformsModel
      .find({}, { slug: 1 })
      .lean<{ _id: mongoose.Types.ObjectId; slug: string }[]>();

    return new Map(platforms.map(({ _id, slug }) => [String(_id), slug]));
  }

  private async fetchReleaseSignals(
    vnIds: string[]
  ): Promise<TReleaseSignalsByVn> {
    const signalsByVn = new Map<
      string,
      {
        publishers: Set<string>;
        releaseDates: Set<string>;
        platforms: Set<string>;
      }
    >();
    if (!vnIds.length) return new Map();

    for (let i = 0; i < vnIds.length; i += VNDB_RELEASE_ID_CHUNK_SIZE) {
      const chunk = vnIds.slice(i, i + VNDB_RELEASE_ID_CHUNK_SIZE);
      const wanted = new Set(chunk);
      const filters: TVndbFilters = [
        "or",
        ...chunk.map((id): TVndbFilter => [
          "vn",
          "=",
          ["id", "=", id] satisfies TVndbFilter,
        ]),
      ];

      let page = 1;
      let more = true;

      while (more) {
        const data = await this.post<IVndbReleaseResponse>("/release", {
          filters,
          fields:
            "official,released,platforms,vns.id,producers.name,producers.original,producers.aliases,producers.publisher",
          results: VNDB_RELEASE_PAGE_SIZE,
          page,
        });

        for (const release of data.results) {
          if (!release.official) continue;

          const publishers = (release.producers ?? [])
            .filter(({ publisher }) => publisher)
            .flatMap(({ name, original, aliases }) => [
              name,
              original,
              ...(aliases ?? []),
            ])
            .filter((name): name is string => !!name);

          for (const { id } of release.vns ?? []) {
            if (!wanted.has(id)) continue;

            const signals = signalsByVn.get(id) ?? {
              publishers: new Set<string>(),
              releaseDates: new Set<string>(),
              platforms: new Set<string>(),
            };

            publishers.forEach((name) => signals.publishers.add(name));
            if (release.released) signals.releaseDates.add(release.released);
            (release.platforms ?? []).forEach((platform) =>
              signals.platforms.add(platform)
            );

            signalsByVn.set(id, signals);
          }
        }

        more = data.more;
        page++;

        await sleep(VNDB_REQUEST_DELAY_MS);
      }
    }

    return new Map(
      [...signalsByVn].map(([id, { publishers, releaseDates, platforms }]) => [
        id,
        {
          publishers: [...publishers],
          releaseDates: [...releaseDates],
          platforms: [...platforms],
        },
      ])
    );
  }

  private companyMatchScore(vn: IVndbTitles, game: TVndbCandidate): number {
    const companies = game.companies ?? [];
    if (!companies.length) return 0;

    const roleScore = (
      vndbNames: string[],
      hasRole: (company: ICompanyField) => boolean
    ) => {
      if (!vndbNames.length) return 0;

      const matched = companies.filter((company) =>
        vndbNames.some((name) => isSameCompanyName(name, company.name))
      );
      if (!matched.length) return 0;

      return matched.some(hasRole)
        ? VNDB_ROLE_COMPANY_SCORE
        : VNDB_ANY_COMPANY_SCORE;
    };

    return (
      roleScore(
        vn.developers,
        ({ developer, porting, supporting }) =>
          developer || porting || supporting
      ) + roleScore(vn.publishers, ({ publisher }) => publisher)
    );
  }

  private hasCompanyMismatch(vn: IVndbTitles, game: TVndbCandidate): boolean {
    const companies = game.companies ?? [];
    const vndbNames = [...vn.developers, ...vn.publishers];

    if (!companies.length || !vndbNames.length) return false;

    return !companies.some(({ name }) =>
      vndbNames.some((vndbName) => isSameCompanyName(vndbName, name))
    );
  }

  private titleKeyMap(rawTitles: string[]): Map<string, boolean> {
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
  }

  private gameTitleKeys(game: TVndbCandidate): Set<string> {
    return new Set(
      this.titleKeyMap([game.name, ...(game.alternative_names ?? [])]).keys()
    );
  }

  private matchedTitles(
    vn: IVndbTitles,
    game: TVndbCandidate
  ): { key: string; isExact: boolean }[] {
    const gameKeys = this.titleKeyMap([
      game.name,
      ...(game.alternative_names ?? []),
    ]);
    const vnKeys = this.titleKeyMap([vn.name, ...vn.alternativeNames]);

    const matched: { key: string; isExact: boolean }[] = [];

    for (const [key, isVnPrimary] of vnKeys) {
      const isGamePrimary = gameKeys.get(key);
      if (isGamePrimary === undefined) continue;

      matched.push({ key, isExact: isVnPrimary && isGamePrimary });
    }

    return matched;
  }

  private isSimilarTitle(
    vn: IVndbTitles,
    game: TVndbCandidate,
    threshold = VNDB_FUZZY_TITLE_SIMILARITY
  ): boolean {
    const toTokenSets = (titles: string[]) =>
      titles
        .map(normalizeTitle)
        .filter(Boolean)
        .map(tokenSetFrom)
        .filter((set) => set.size);

    const vnTitles = toTokenSets([vn.name, ...vn.alternativeNames]);
    const gameTitles = toTokenSets([
      game.name,
      ...(game.alternative_names ?? []),
    ]);

    return vnTitles.some((vnTokens) =>
      gameTitles.some(
        (gameTokens) => jaccard(vnTokens, gameTokens) >= threshold
      )
    );
  }

  private compareDescriptions(
    vn: IVndbTitles,
    game: TVndbCandidate
  ): TDescriptionSignal {
    const vnTokens = descriptionTokens(vn.description ?? "");
    const gameTokens = descriptionTokens(game.summary ?? "");

    if (
      vnTokens.size < MIN_DESCRIPTION_TOKENS ||
      gameTokens.size < MIN_DESCRIPTION_TOKENS
    ) {
      return "unknown";
    }

    return descriptionOverlap(vnTokens, gameTokens) >=
      VNDB_DESCRIPTION_SIMILARITY
      ? "match"
      : "mismatch";
  }

  private isMainTitleMatch(
    vn: IVndbTitles,
    game: TVndbCandidate,
    titles: { key: string; isExact: boolean }[]
  ): boolean {
    const vnMainKeys = new Set(
      [vn.name, vn.originalName].map(titleKey).filter(Boolean)
    );
    const gameMainKey = titleKey(game.name);

    return titles.some(
      ({ key, isExact }) =>
        isExact && key === gameMainKey && vnMainKeys.has(key)
    );
  }

  private isDistinctiveTitle(
    title: string,
    sharedTitles: Set<string>
  ): boolean {
    return (
      !sharedTitles.has(title) &&
      title.length >= MIN_STRING_LENGTH &&
      title.split(" ").length >= MIN_TITLE_WORDS
    );
  }

  private titleMatchScore(
    titles: { key: string; isExact: boolean }[],
    sharedTitles: Set<string>
  ): number {
    let bestScore = 0;

    for (const { key, isExact } of titles) {
      const tier = this.isDistinctiveTitle(key, sharedTitles)
        ? VNDB_DISTINCTIVE_TITLE_SCORE
        : isStrongTitle(key)
          ? VNDB_STRONG_TITLE_SCORE
          : VNDB_WEAK_TITLE_SCORE;

      const points = isExact ? tier : Math.min(tier, VNDB_STRONG_TITLE_SCORE);

      if (points > bestScore) bestScore = points;
    }

    return bestScore;
  }

  private platformMatchScore(
    vn: IVndbTitles,
    game: TVndbCandidate,
    platformSlugById: Map<string, string>
  ): number {
    const vnSlugs = new Set(
      vn.platforms.flatMap((platform) => VNDB_PLATFORM_SLUGS[platform] ?? [])
    );
    const gameSlugs = (game.platformIds ?? [])
      .map((id) => platformSlugById.get(String(id)))
      .filter((slug): slug is string => !!slug);

    if (!vnSlugs.size || !gameSlugs.length) return 0;

    return gameSlugs.some((slug) => vnSlugs.has(slug))
      ? VNDB_PLATFORM_MATCH_SCORE
      : VNDB_PLATFORM_MISMATCH_SCORE;
  }

  private genreMatchScore(game: TVndbCandidate): number {
    const genres = game.genres ?? [];
    if (!genres.length) return 0;

    if (genres.includes(VISUAL_NOVEL_GENRE)) return VNDB_GENRE_SCORE;

    return genres.some((genre) => INCOMPATIBLE_GENRES.includes(genre))
      ? VNDB_INCOMPATIBLE_GENRE_SCORE
      : 0;
  }

  private matchNovels(
    vndbTitles: IVndbTitles[],
    candidatesByVn: TCandidatesByVn,
    context: IScoreContext
  ): IVnMatch[] {
    return vndbTitles.map((vn) =>
      this.resolveMatch(vn, candidatesByVn.get(vn.id) ?? [], context)
    );
  }

  private scoreCandidate(
    vn: IVndbTitles,
    game: TVndbCandidate,
    { platformSlugById, sharedTitles }: IScoreContext
  ): IScoredCandidate {
    const dateSignal = this.compareDates(vn.releaseDates, game);
    const titles = this.matchedTitles(vn, game);
    const hasCompanyMismatch = this.hasCompanyMismatch(vn, game);

    const breakdown: IScoreBreakdown = {
      date:
        dateSignal === "confirms"
          ? VNDB_DATE_CONFIRMS_SCORE
          : dateSignal === "contradicts"
            ? VNDB_DATE_CONTRADICTS_SCORE
            : 0,
      genre: this.genreMatchScore(game),
      type:
        game.type === MAIN_GAME_TYPE
          ? 1
          : REEDITION_TYPES.includes(game.type)
            ? -1
            : 0,
      title: titles.length
        ? this.titleMatchScore(titles, sharedTitles)
        : this.isSimilarTitle(vn, game)
          ? VNDB_WEAK_TITLE_SCORE
          : 0,
      companies:
        this.companyMatchScore(vn, game) +
        (hasCompanyMismatch ? VNDB_COMPANY_MISMATCH_SCORE : 0),
      platforms: this.platformMatchScore(vn, game, platformSlugById),
    };

    const score = Object.values(breakdown).reduce((sum, part) => sum + part, 0);

    return {
      game,
      score,
      dateSignal,
      breakdown,
      isDistinctiveTitle: titles.some(
        ({ key, isExact }) =>
          isExact && this.isDistinctiveTitle(key, sharedTitles)
      ),
      isMainTitleMatch: this.isMainTitleMatch(vn, game, titles),
      isCorroborated: breakdown.date > 0 || breakdown.companies > 0,
      isContradicted: dateSignal === "contradicts",
      hasCompanyMismatch,
      descriptionSignal: this.compareDescriptions(vn, game),
    };
  }

  private getRejectionReason(candidate: IScoredCandidate): TMatchReason | null {
    if (candidate.breakdown.title < VNDB_STRONG_TITLE_SCORE) {
      return "weak-title";
    }
    if (candidate.isContradicted) return "date-contradicts";

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
  }

  private resolveMatch(
    vn: IVndbTitles,
    candidates: TVndbCandidate[],
    context: IScoreContext
  ): IVnMatch {
    const scored = candidates
      .map((game) => this.scoreCandidate(vn, game, context))
      .sort((a, b) => b.score - a.score);

    const viable = scored.filter(({ score }) => score >= VNDB_SCORE_THRESHOLD);

    if (!viable.length) {
      return {
        vnId: vn.id,
        vnName: vn.name,
        verdict: "absent",
        reason: scored.length ? "below-threshold" : null,
        winner: null,
        candidates: scored,
      };
    }

    const [best, runnerUp] = viable;

    const isUnique = !runnerUp || best.score - runnerUp.score >= VNDB_SCORE_GAP;
    const reason = isUnique
      ? this.getRejectionReason(best)
      : "competing-candidates";

    return {
      vnId: vn.id,
      vnName: vn.name,
      verdict: reason ? "ambiguous" : "matched",
      reason,
      winner: reason ? null : best.game,
      candidates: scored,
    };
  }

  private parseVndbDate(date: string) {
    if (!date) return null;

    if (/^\d{4}$/.test(date)) {
      return new Date(Date.UTC(Number(date), 0, 1));
    }

    if (/^\d{4}-\d{2}$/.test(date)) {
      const [year, month] = date.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, 1));
    }

    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      const [year, month, day] = date.split("-").map(Number);

      return new Date(Date.UTC(year, month - 1, day));
    }

    return null;
  }

  private isCloseDate(vndbDate: Date, igdbDate: Date): boolean {
    const diffYears = Math.abs(
      vndbDate.getUTCFullYear() - igdbDate.getUTCFullYear()
    );

    if (diffYears <= 1) return true;

    const diffDays = Math.abs(+vndbDate - +igdbDate) / (1000 * 60 * 60 * 24);

    return diffDays <= VNDB_DATE_MAX_DIFF_DAYS;
  }

  private compareDates(vndbDates: string[], game: TVndbCandidate): TDateSignal {
    const vndbParsed = vndbDates
      .map((date) => this.parseVndbDate(date))
      .filter((date): date is Date => !!date);

    const igdbParsed = [
      game.first_release,
      ...(game.release_dates ?? []).map(({ date }) => date),
    ]
      .filter((timestamp): timestamp is number => !!timestamp)
      .map((timestamp) => new Date(timestamp * 1000));

    if (!vndbParsed.length || !igdbParsed.length) return "unknown";

    const isConfirmed = vndbParsed.some((vndbDate) =>
      igdbParsed.some((igdbDate) => this.isCloseDate(vndbDate, igdbDate))
    );

    return isConfirmed ? "confirms" : "contradicts";
  }

  private getTitles(vn: IVndbNovel): IVndbTitles {
    const englishTitles = vn.titles.filter(({ lang }) => lang === "en");
    const mainTitle = vn.titles.find(({ main }) => main);

    const name =
      englishTitles.find(({ official }) => official)?.title ??
      englishTitles[0]?.title ??
      vn.title;

    const alternativeNames = [
      vn.title,
      vn.alttitle,
      ...vn.titles.flatMap(({ title, latin }) => [title, latin]),
    ].filter((title): title is string => !!title && title !== name);

    return {
      id: vn.id,
      name,
      released: vn.released,
      description: vn.description ?? "",
      originalName: mainTitle?.title ?? vn.alttitle ?? vn.title,
      alternativeNames: [...new Set(alternativeNames)],
      developers: [
        ...new Set(
          (vn.developers ?? [])
            .flatMap(({ name, original, aliases }) => [
              name,
              original,
              ...(aliases ?? []),
            ])
            .filter((name): name is string => !!name)
        ),
      ],
      publishers: [],
      releaseDates: vn.released ? [vn.released] : [],
      platforms: vn.platforms ?? [],
    };
  }
}

export interface IVndbTitles {
  id: string;
  name: string;
  released: string;
  description: string;
  originalName: string;
  alternativeNames: string[];
  developers: string[];
  publishers: string[];
  releaseDates: string[];
  platforms: string[];
}
