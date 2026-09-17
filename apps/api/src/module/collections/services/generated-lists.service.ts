import { randomBytes } from "node:crypto";
import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import * as bcrypt from "bcryptjs";
import mongoose, { type Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import {
  ADULT_THEME_NAME,
  FEATURED_PLATFORM_SLUGS,
  type IGetGamesRequest,
} from "@mooncellar/schemas";
import { gamesFilters, weightedRatingExpr } from "../../../shared/games";
import { runCronExclusive } from "../../../shared/cron-mutex";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { Game } from "../../games/schemas/game.schema";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import { Platform } from "../../games/schemas/platform.schema";
import { User } from "../../user/schemas/user.schema";
import {
  GENERATED_LIST_DECADES,
  GENERATED_LIST_GAME_TYPES,
  GENERATED_LIST_SIZE,
  GENERATED_LIST_VOTES_STEPS,
  GENERATED_LISTS_CRON,
  GENERATED_LISTS_CRON_OPTIONS,
  GENERATED_LISTS_OWNER,
} from "../constants/generated-lists";
import {
  CustomList,
  type ICustomListGeneratorKind,
} from "../schemas/custom-list.schema";
import { normalizeListName } from "../utils/collections.utils";
import { findFreeListSlug } from "../utils/list-slug.utils";

type IGeneratedListDefinition = {
  kind: ICustomListGeneratorKind;
  key: string;
  name: string;
  scope: string;
  filters: Pick<IGetGamesRequest, "selected" | "years">;
};

export type IGeneratedListsReport = {
  created: number;
  updated: number;
  unchanged: number;
  skipped: string[];
  failed: string[];
};

const GENERATED_LISTS_JOB = "generated-lists-refresh";

const RATING_SOURCES =
  "ranked by the combined rating from IGDB, HowLongToBeat and MoonCellar players. Updated every week.";

const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number } | null)?.code === 11000;

@Injectable()
export class GeneratedListsService {
  private readonly logger = new Logger(GeneratedListsService.name);

  constructor(
    @InjectModel(CustomList.name)
    private readonly listModel: Model<CustomList>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(Platform.name)
    private readonly platformModel: Model<Platform>,
    private readonly pino: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {}

  private isRunning = false;

  get isRefreshing() {
    return this.isRunning;
  }

  @Cron(GENERATED_LISTS_CRON, GENERATED_LISTS_CRON_OPTIONS)
  async refreshCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, GENERATED_LISTS_JOB, () =>
        this.metrics.trackSync(GENERATED_LISTS_JOB, () => this.refreshAll())
      )
    );
  }

  async refreshAll(): Promise<IGeneratedListsReport> {
    if (this.isRunning) {
      this.logger.warn("Generated lists refresh is already running, skipped");

      return { created: 0, updated: 0, unchanged: 0, skipped: [], failed: [] };
    }

    this.isRunning = true;

    const report: IGeneratedListsReport = {
      created: 0,
      updated: 0,
      unchanged: 0,
      skipped: [],
      failed: [],
    };

    try {
      const owner = await this.ensureOwner();
      const definitions = await this.getDefinitions();

      this.logger.log(
        `Refreshing generated lists: ${definitions.length} lists to build`
      );

      for (const [index, definition] of definitions.entries()) {
        const progress = `${index + 1}/${definitions.length}`;
        const label = `${definition.kind}:${definition.key}`;

        try {
          const { ids, votes } = await this.findTopGameIds(definition);

          if (!ids.length) {
            report.skipped.push(label);
            this.logger.log(
              `Generated lists progress: ${progress} ${definition.name} skipped, no rated games`
            );
            continue;
          }

          const result = await this.saveList(owner, definition, ids);

          report[result] += 1;
          this.logger.log(
            `Generated lists progress: ${progress} ${definition.name} ${result} (${ids.length} games, votes >= ${votes})`
          );
        } catch (err) {
          report.failed.push(label);
          this.logger.error(
            err,
            `Generated lists progress: ${progress} ${definition.name} failed`
          );
        }
      }

      this.logger.log(
        `Generated lists refreshed: ${report.created} created, ${report.updated} updated, ${report.unchanged} unchanged, ${report.skipped.length} skipped, ${report.failed.length} failed`
      );

      return report;
    } catch (err) {
      this.logger.error(err, "Failed to refresh generated lists");
      throw err;
    } finally {
      this.isRunning = false;
    }
  }

  private async ensureOwner() {
    const existing = await this.userModel
      .findOne({ userName: GENERATED_LISTS_OWNER.userName })
      .select("_id")
      .lean();

    if (existing) return existing._id as mongoose.Types.ObjectId;

    try {
      const created = await this.userModel.create({
        userName: GENERATED_LISTS_OWNER.userName,
        email: GENERATED_LISTS_OWNER.email,
        password: await bcrypt.hash(randomBytes(32).toString("hex"), 10),
        roles: ["user"],
      });

      return created._id as mongoose.Types.ObjectId;
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;

      const owner = await this.userModel
        .findOne({ userName: GENERATED_LISTS_OWNER.userName })
        .select("_id")
        .orFail()
        .lean();

      return owner._id as mongoose.Types.ObjectId;
    }
  }

  private async getDefinitions(): Promise<IGeneratedListDefinition[]> {
    const [genres, platforms] = await Promise.all([
      this.gameModel.distinct("genres"),
      this.platformModel
        .find({ slug: { $in: FEATURED_PLATFORM_SLUGS } })
        .select("_id name slug")
        .lean(),
    ]);

    const decades = GENERATED_LIST_DECADES.map(
      ([start, end]): IGeneratedListDefinition => ({
        kind: "decade",
        key: `${start}-${end}`,
        name: `Best games of ${start}–${end}`,
        scope: `released from ${start} to ${end}`,
        filters: { years: [start, end] },
      })
    );

    const genreLists = (genres as string[])
      .filter((genre) => typeof genre === "string" && !!genre.trim())
      .sort((a, b) => a.localeCompare(b))
      .map((genre): IGeneratedListDefinition => ({
        kind: "genre",
        key: genre,
        name: `Best ${genre} games`,
        scope: `in ${genre} of all time`,
        filters: { selected: { genres: [genre] } },
      }));

    const platformLists = FEATURED_PLATFORM_SLUGS.map((slug) =>
      platforms.find((platform) => platform.slug === slug)
    )
      .filter((platform) => !!platform)
      .map((platform): IGeneratedListDefinition => ({
        kind: "platform",
        key: platform.slug,
        name: `Best ${platform.name} games`,
        scope: `on ${platform.name}`,
        filters: { selected: { platforms: [platform._id.toString()] } },
      }));

    return [...decades, ...genreLists, ...platformLists];
  }

  private async findTopGameIds({ filters }: IGeneratedListDefinition) {
    const now = Math.floor(Date.now() / 1000);
    let ids: mongoose.Types.ObjectId[] = [];
    let usedVotes = GENERATED_LIST_VOTES_STEPS[0];

    for (const votes of GENERATED_LIST_VOTES_STEPS) {
      const rows = await this.gameModel
        .aggregate<{ _id: mongoose.Types.ObjectId }>([
          gamesFilters({
            ...filters,
            selected: {
              ...filters.selected,
              types: GENERATED_LIST_GAME_TYPES,
            },
            excluded: { themes: [ADULT_THEME_NAME] },
            votes,
          }),
          { $match: { first_release: { $lte: now } } },
          { $addFields: { generatedScore: weightedRatingExpr } },
          { $match: { generatedScore: { $ne: null } } },
          {
            $sort: {
              generatedScore: -1,
              "igdb.total_rating_count": -1,
              _id: 1,
            },
          },
          { $limit: GENERATED_LIST_SIZE },
          { $project: { _id: 1 } },
        ])
        .allowDiskUse(true);

      ids = rows.map((row) => row._id);
      usedVotes = votes;

      if (ids.length >= GENERATED_LIST_SIZE) break;
    }

    return { ids, votes: usedVotes };
  }

  private async saveList(
    ownerId: mongoose.Types.ObjectId,
    definition: IGeneratedListDefinition,
    gameIds: mongoose.Types.ObjectId[]
  ): Promise<"created" | "updated" | "unchanged"> {
    const description = `The ${gameIds.length} highest-rated games ${definition.scope}, ${RATING_SOURCES}`;
    const existing = await this.listModel.findOne({
      "generator.kind": definition.kind,
      "generator.key": definition.key,
    });
    const now = new Date();

    if (!existing) {
      try {
        await this.listModel.create({
          userId: ownerId,
          name: definition.name,
          nameNormalized: normalizeListName(definition.name),
          slug: await findFreeListSlug(
            this.listModel,
            ownerId,
            definition.name
          ),
          description,
          isPrivate: false,
          games: gameIds.map((gameId) => ({ gameId, addedAt: now })),
          gamesCount: gameIds.length,
          generator: { kind: definition.kind, key: definition.key },
        });

        return "created";
      } catch (error) {
        if (isDuplicateKeyError(error)) return "unchanged";

        throw error;
      }
    }

    const nextOrder = gameIds.map((id) => id.toString());
    const isSameGames =
      existing.games.map((game) => game.gameId.toString()).join(",") ===
      nextOrder.join(",");

    if (
      isSameGames &&
      existing.name === definition.name &&
      existing.description === description
    ) {
      return "unchanged";
    }

    const addedAt = new Map(
      existing.games.map((game) => [game.gameId.toString(), game.addedAt])
    );

    existing.games = gameIds.map((gameId) => ({
      gameId,
      addedAt: addedAt.get(gameId.toString()) ?? now,
    }));
    existing.gamesCount = gameIds.length;
    existing.name = definition.name;
    existing.nameNormalized = normalizeListName(definition.name);
    existing.description = description;
    await existing.save();

    return "updated";
  }
}
