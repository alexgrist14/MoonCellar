import { ConflictException, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { Model, Types } from "mongoose";
import { Game, type GameDocument } from "../schemas/game.schema";
import { Platform } from "../schemas/platform.schema";
import {
  MIN_COMPANY_PREFIX_LENGTH,
  VNDB_FALLBACK_COMPANY_CHUNK_SIZE,
  VNDB_FALLBACK_TITLE_SIMILARITY,
} from "../constants/vndb";
import {
  companySearchPrefix,
  isSameCompanyName,
  titleKey,
  titleKeyVariants,
} from "../utils/title-match.utils";
import {
  MATCH_CANDIDATE_PROJECTION,
  gameTitleKeys,
  isSimilarTitle,
  isStrongTitle,
  resolveMatch,
} from "./game-matcher.utils";
import { IGDB_MATCH_PROFILE } from "./match-profiles";
import type {
  ICandidateSearch,
  IMatchSubject,
  TMatchCandidate,
} from "./game-matcher.types";
import {
  type ICompanyField,
  type IPossibleDuplicate,
  POSSIBLE_DUPLICATES_MESSAGE,
} from "@mooncellar/schemas";

interface IDuplicateCheckInput {
  name: string;
  alternative_names?: string[] | null;
  first_release?: number | null;
  companies?: ICompanyField[] | null;
  platformIds?: (Types.ObjectId | string)[] | null;
  type?: string | null;
  summary?: string | null;
}

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@Injectable()
export class GameMatcherService {
  constructor(
    @InjectModel(Game.name) private readonly gamesModel: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<Platform>
  ) {}

  async getPlatformSlugById(): Promise<Map<string, string>> {
    const platforms = await this.platformsModel
      .find({}, { slug: 1 })
      .lean<{ _id: Types.ObjectId; slug: string }[]>();

    return new Map(platforms.map(({ _id, slug }) => [String(_id), slug]));
  }

  async assertNoDuplicates(game: IDuplicateCheckInput) {
    const duplicates = await this.findLikelyDuplicates(game);

    if (duplicates.length) {
      throw new ConflictException({
        message: POSSIBLE_DUPLICATES_MESSAGE,
        duplicates,
      });
    }
  }

  async findLikelyDuplicates(
    game: IDuplicateCheckInput
  ): Promise<IPossibleDuplicate[]> {
    const platformSlugById = await this.getPlatformSlugById();
    const companies = game.companies ?? [];
    const subject: IMatchSubject = {
      id: "new",
      name: game.name,
      originalName: game.name,
      alternativeNames: game.alternative_names ?? [],
      type: game.type ?? "",
      releaseDates: game.first_release
        ? [new Date(game.first_release * 1000).toISOString().slice(0, 10)]
        : [],
      developers: companies
        .filter(({ developer, porting, supporting }) =>
          Boolean(developer || porting || supporting)
        )
        .map(({ name }) => name),
      publishers: companies
        .filter(({ publisher }) => publisher)
        .map(({ name }) => name),
      platformSlugs: (game.platformIds ?? []).flatMap(
        (id) => platformSlugById.get(String(id)) ?? []
      ),
      description: game.summary ?? "",
    };
    const { candidatesBySubject, sharedTitles } = await this.findCandidates([
      subject,
    ]);
    const { candidates } = resolveMatch(
      subject,
      candidatesBySubject.get(subject.id) ?? [],
      { platformSlugById, sharedTitles },
      IGDB_MATCH_PROFILE
    );
    return candidates
      .filter(({ score }) => score >= IGDB_MATCH_PROFILE.threshold)
      .map(({ game: candidate, score }) => ({
        _id: String(candidate._id),
        name: candidate.name,
        slug: candidate.slug,
        score,
      }));
  }

  async findCandidates(subjects: IMatchSubject[]): Promise<ICandidateSearch> {
    const subjectIdsByKey = new Map<string, Set<string>>();
    const strongKeys: string[] = [];
    const rawNames: string[] = [];

    for (const subject of subjects) {
      for (const raw of [subject.name, ...subject.alternativeNames]) {
        rawNames.push(raw);
        const key = titleKey(raw);
        if (!key) continue;

        for (const candidateKey of [key, ...titleKeyVariants(raw)]) {
          if (isStrongTitle(candidateKey) || raw === subject.name) {
            strongKeys.push(candidateKey);
          }

          const set = subjectIdsByKey.get(candidateKey) ?? new Set();
          set.add(subject.id);
          subjectIdsByKey.set(candidateKey, set);
        }
      }
    }

    const existingGames = await this.gamesModel
      .find(
        {
          $or: [
            { nameNormalized: { $in: [...new Set(strongKeys)] } },
            { name: { $in: [...new Set(rawNames)] } },
            { alternative_names: { $in: [...new Set(rawNames)] } },
          ],
        },
        MATCH_CANDIDATE_PROJECTION
      )
      .lean<TMatchCandidate[]>();

    const candidatesBySubject = new Map<string, TMatchCandidate[]>();

    const addCandidate = (subjectId: string, game: TMatchCandidate) => {
      const list = candidatesBySubject.get(subjectId) ?? [];
      if (list.some((g) => String(g._id) === String(game._id))) return;
      list.push(game);
      candidatesBySubject.set(subjectId, list);
    };

    for (const game of existingGames) {
      const gameTitles = gameTitleKeys(game);

      for (const [key, subjectIds] of subjectIdsByKey) {
        if (!gameTitles.has(key)) continue;

        for (const subjectId of subjectIds) addCandidate(subjectId, game);
      }
    }

    const fallback = await this.findCandidatesByCompany(
      subjects.filter(({ id }) => !candidatesBySubject.has(id))
    );

    for (const [subjectId, games] of fallback) {
      for (const game of games) addCandidate(subjectId, game);
    }

    const sharedTitles = new Set(
      [...subjectIdsByKey]
        .filter(([, subjectIds]) => subjectIds.size > 1)
        .map(([key]) => key)
    );

    return { candidatesBySubject, sharedTitles };
  }

  private async findCandidatesByCompany(
    subjects: IMatchSubject[]
  ): Promise<Map<string, TMatchCandidate[]>> {
    const result = new Map<string, TMatchCandidate[]>();
    const prefixes = [
      ...new Set(
        subjects
          .flatMap(({ developers }) => developers)
          .map(companySearchPrefix)
          .filter((name) => name.length >= MIN_COMPANY_PREFIX_LENGTH)
      ),
    ];

    if (!prefixes.length) return result;

    const gamesById = new Map<string, TMatchCandidate>();

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
          MATCH_CANDIDATE_PROJECTION
        )
        .lean<TMatchCandidate[]>();

      for (const game of found) gamesById.set(String(game._id), game);
    }

    for (const game of gamesById.values()) {
      for (const subject of subjects) {
        const isSameStudio = (game.companies ?? []).some(({ name }) =>
          subject.developers.some((developer) =>
            isSameCompanyName(developer, name)
          )
        );
        if (!isSameStudio) continue;
        if (!isSimilarTitle(subject, game, VNDB_FALLBACK_TITLE_SIMILARITY)) {
          continue;
        }

        result.set(subject.id, [...(result.get(subject.id) ?? []), game]);
      }
    }

    return result;
  }
}
