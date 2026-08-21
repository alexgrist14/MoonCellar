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
  IVnMatch,
  TCandidatesByVn,
  TDateSignal,
  TVndbCandidate,
  TVndbFilter,
  TVndbFilters,
} from "../interface/vndb.interface";
import { normalizeTitle } from "../utils/title-match.utils";
import {
  MAIN_GAME_TYPE,
  MIN_STRING_LENGTH,
  REEDITION_TYPES,
  VISUAL_NOVEL_GENRE,
  VNDB_SCORE_GAP,
  VNDB_SCORE_THRESHOLD,
} from "../constants/vndb";
import { VndbCandidate } from "../schemas/vndb-candidates.schema";

const VNDB_API_URL = "https://api.vndb.org/kana";

const isStrongTitle = (normalized: string) =>
  normalized.length >= MIN_STRING_LENGTH || normalized.split(" ").length > 1;

@Injectable()
export class VndbService {
  private readonly logger = new Logger(VndbService.name);

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    @InjectModel(VndbCandidate.name)
    private readonly vndbCandidatesModel: Model<VndbCandidate>
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
    let page = 3;
    const { data } = await firstValueFrom(
      this.httpService.post<IVndbGameResponse>(`${VNDB_API_URL}/vn`, {
        page,
      })
    );

    if (data.more) page++;

    const searchIdsFilters: TVndbFilter[] = data.results.map(({ id }) => [
      "id",
      "=",
      id,
    ]);

    const { data: novelsResponse } = await firstValueFrom(
      this.httpService.post<IVndbGameResponse>(`${VNDB_API_URL}/vn`, {
        filters: ["or", ...searchIdsFilters] satisfies TVndbFilters,
        fields:
          "title,alttitle,titles.title,titles.lang,titles.latin,titles.official,titles.main,released,developers.name",
      })
    );

    const vndbTitles = novelsResponse.results.map((vn) => this.getTitles(vn));

    const vnIdsByNormalized = new Map<string, Set<string>>();
    const strongKeys: string[] = [];
    const rawAltNames: string[] = [];

    for (const vn of vndbTitles) {
      for (const raw of [vn.name, ...vn.alternativeNames]) {
        rawAltNames.push(raw);
        const normalized = normalizeTitle(raw);
        if (!normalized) continue;
        if (isStrongTitle(normalized) || raw === vn.name) {
          strongKeys.push(normalized);
        }
        const set = vnIdsByNormalized.get(normalized) ?? new Set();
        set.add(vn.id);
        vnIdsByNormalized.set(normalized, set);

        if (isStrongTitle(normalized)) strongKeys.push(normalized);
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
              alternative_names: {
                $in: [...new Set(rawAltNames)],
              },
            },
          ],
        },
        {
          name: 1,
          nameNormalized: 1,
          type: 1,
          genres: 1,
          first_release: 1,
          alternative_names: 1,
          companies: 1,
        }
      )
      .lean();

    console.log(existingGames);

    const candidatesByVn: TCandidatesByVn = new Map();

    for (const game of existingGames) {
      const gameTitles = new Set<string>([
        game.nameNormalized,
        ...(game.alternative_names ?? []).map(normalizeTitle).filter(Boolean),
      ]);

      for (const [normalized, vnIds] of vnIdsByNormalized) {
        if (!gameTitles.has(normalized)) continue;

        for (const vnId of vnIds) {
          const list = candidatesByVn.get(vnId) ?? [];
          if (list.some((g) => String(g._id) === String(game._id))) continue;
          list.push(game);
          candidatesByVn.set(vnId, list);
        }
      }
    }

    const matches = this.matchNovels(vndbTitles, candidatesByVn);
    const candidatesForMatch = matches.filter(
      ({ verdict }) => verdict === "ambiguous"
    );

    try {
      await this.vndbCandidatesModel.insertMany(
        candidatesForMatch.map(({ vnId, candidates }) => ({
          vnId,
          candidates: candidates.map(({ game }) => new Types.ObjectId(game._id)),
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

  private bestTitleMatchScore(vn: IVndbTitles, game: TVndbCandidate): number {
    const gameTitles = [
      game.nameNormalized,
      ...(game.alternative_names ?? []).map(normalizeTitle).filter(Boolean),
    ];
    let bestScore = 0;
    for (const raw of [vn.name, ...vn.alternativeNames]) {
      const n = normalizeTitle(raw);
      if (!n || !gameTitles.includes(n)) continue;

      const points = isStrongTitle(n) ? 4 : 1;
      if (points > bestScore) bestScore = points;
    }
    return bestScore;
  }

  private matchNovels(
    vndbTitles: IVndbTitles[],
    candidatesByVn: TCandidatesByVn
  ): IVnMatch[] {
    return vndbTitles.map((vn) =>
      this.resolveMatch(vn, candidatesByVn.get(vn.id) ?? [])
    );
  }

  private scoreCandidate(
    vn: IVndbTitles,
    game: TVndbCandidate
  ): IScoredCandidate {
    const dateSignal = this.compareDates(vn.released, game.first_release);

    let score = 0;

    if (dateSignal === "confirms") score += 3;
    if (dateSignal === "contradicts") score -= 4;

    if (game.genres?.length) {
      score += game.genres.includes(VISUAL_NOVEL_GENRE) ? 2 : -2;
    }

    score +=
      game.type === MAIN_GAME_TYPE
        ? 1
        : REEDITION_TYPES.includes(game.type)
          ? -1
          : 0;
    score += this.bestTitleMatchScore(vn, game);
    if (
      vn.developers.some((developer) =>
        game.companies.some((company) => company.name === developer)
      )
    )
      score += 1;

    return { game, score, dateSignal };
  }

  private resolveMatch(
    vn: IVndbTitles,
    candidates: TVndbCandidate[]
  ): IVnMatch {
    const scored = candidates
      .map((game) => this.scoreCandidate(vn, game))
      .sort((a, b) => b.score - a.score);

    const viable = scored.filter(({ score }) => score >= VNDB_SCORE_THRESHOLD);

    if (!viable.length) {
      return {
        vnId: vn.id,
        verdict: "absent",
        winner: null,
        candidates: scored,
      };
    }

    const isConfident =
      viable.length === 1 ||
      viable[0].score - viable[1].score >= VNDB_SCORE_GAP;

    return {
      vnId: vn.id,
      verdict: isConfident ? "matched" : "ambiguous",
      winner: isConfident ? viable[0].game : null,
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

  private compareDates(
    vndbDateStr: string,
    igdbTimestamp: number
  ): TDateSignal {
    const vndbDate = this.parseVndbDate(vndbDateStr);
    if (!vndbDate || !igdbTimestamp) return "unknown";

    const igdbDate = new Date(igdbTimestamp * 1000);

    const diffYears = Math.abs(
      vndbDate.getUTCFullYear() - igdbDate.getUTCFullYear()
    );

    if (diffYears <= 1) return "confirms";

    const diffDays = Math.abs(+vndbDate - +igdbDate) / (1000 * 60 * 60 * 24);

    if (diffDays <= 366) return "confirms";

    return "contradicts";
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
      originalName: mainTitle?.title ?? vn.alttitle ?? vn.title,
      alternativeNames: [...new Set(alternativeNames)],
      developers: vn.developers?.map(({ name }) => name) ?? [],
    };
  }
}

export interface IVndbTitles {
  id: string;
  name: string;
  released: string;
  originalName: string;
  alternativeNames: string[];
  developers: string[];
}
