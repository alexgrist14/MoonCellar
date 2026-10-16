import {
  BadRequestException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  type AuthObject,
  buildAuthorization,
  type FetchedSystem,
  getConsoleIds,
  getGame,
  getGameExtended,
  getGameList,
  getUserAwards,
} from "@retroachievements/api";
import mongoose, { Model } from "mongoose";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { sleep } from "../../../shared/utils";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive } from "../../../shared/cron-mutex";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";

import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  Platform,
  type PlatformDocument,
} from "../../games/schemas/platform.schema";
import { User } from "../../user/schemas/user.schema";
import { RA_MAIN_USER_NAME } from "../../../shared/constants";
import type {
  IConflictSubject,
  IMatchReason,
  IRetroachievementsField,
} from "@mooncellar/schemas";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import { RaPlaythroughsService } from "./ra-playthroughs.service";
import type {
  IConflictDecision,
  IConflictRecord,
} from "../../conflicts/types/conflicts.types";
import type { TMatchCandidate } from "../../games/matching/game-matcher.types";
import {
  RA_AWARDS_FETCH_DELAY_MS,
  RA_CONSOLE_BY_PLATFORM_SLUG,
  RA_GAMES_FETCH_DELAY_MS,
  RA_SYNC_CRON,
  RA_SYNC_CRON_OPTIONS,
  RA_USE_MATCH_ENGINE,
} from "../constants/sync";
import {
  buildRaPlatformMaps,
  createRaEnginePicker,
  RA_ENGINE_GAME_FIELDS,
} from "../utils/ra-match.utils";
import {
  matchPlatformToConsole,
  matchRaSets,
  RA_MEDIA_URL,
  rankGamesByTitle,
  type TRaRanked,
  toRaSetEntry,
  type TRaSet,
} from "../utils/retroach.utils";

const RA_MISSING_SET_LOOKUPS = 300;

@Injectable()
export class RetroachievementsService implements OnModuleInit {
  private isSyncRunning = false;
  private readonly userName = RA_MAIN_USER_NAME;
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  constructor(
    @InjectModel(Game.name)
    private games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private platforms: Model<PlatformDocument>,
    @InjectModel(User.name)
    private users: Model<User>,
    private readonly logger: PinoLogger,
    private readonly metrics: BusinessMetricsService,
    private readonly conflicts: ConflictsService,
    private readonly raPlaythroughs: RaPlaythroughsService
  ) {
    this.logger.setContext(RetroachievementsService.name);
  }

  private buildAuth(): AuthObject {
    return buildAuthorization({
      username: this.userName,
      webApiKey: this.apiKey,
    });
  }

  private toSnapshot(raGame: TRaSet): Record<string, unknown> {
    return {
      id: raGame.id,
      title: raGame.title,
      consoleId: raGame.consoleId,
      consoleName: raGame.consoleName,
      ...(raGame.imageBoxArt && { cover: raGame.imageBoxArt }),
      numAchievements: raGame.numAchievements,
    };
  }

  private fromSnapshot(
    raId: string,
    data: Record<string, unknown> | null
  ): TRaSet | null {
    if (!data || typeof data.title !== "string") return null;

    return {
      id: Number(raId),
      title: data.title,
      consoleId: Number(data.consoleId),
      consoleName: String(data.consoleName ?? ""),
      imageBoxArt: typeof data.cover === "string" ? data.cover : undefined,
      numAchievements: Number(data.numAchievements ?? 0),
    };
  }

  private async fetchAllGames(
    authorization: AuthObject,
    consoles: FetchedSystem[]
  ): Promise<TRaSet[]> {
    const games: TRaSet[] = [];

    for (let i = 0; i < consoles.length; i++) {
      const console = consoles[i];

      try {
        const consoleGames = await getGameList(authorization, {
          consoleId: console.id,
          shouldOnlyRetrieveGamesWithAchievements: true,
        });

        games.push(...consoleGames);

        this.logger.info(
          `RA console ${i + 1}/${consoles.length} "${console.name}": ${consoleGames.length} games`
        );
      } catch (err) {
        this.logger.error(
          err,
          `Failed to fetch RA games for console "${console.name}"`
        );
      }

      if (i < consoles.length - 1 && RA_GAMES_FETCH_DELAY_MS > 0) {
        await sleep(RA_GAMES_FETCH_DELAY_MS);
      }
    }

    return games;
  }

  private async matchConsolesToPlatforms(consoles: FetchedSystem[]) {
    const platforms = await this.platforms.find();
    const matchedConsoleIds = new Set<number>();
    const platformOps = [];

    for (const platform of platforms) {
      const slugConsoleId = RA_CONSOLE_BY_PLATFORM_SLUG[platform.slug];
      const match =
        slugConsoleId == null
          ? matchPlatformToConsole(platform.name, consoles)
          : consoles.find(({ id }) => id === slugConsoleId);
      if (!match) continue;

      matchedConsoleIds.add(match.id);
      platformOps.push({
        updateOne: {
          filter: { _id: platform._id },
          update: {
            $set: { raId: match.id, updateAt: new Date().toISOString() },
          },
        },
      });
    }

    if (platformOps.length) {
      await this.platforms.bulkWrite(platformOps);
    }

    this.logger.info(
      `Matched ${platformOps.length} platforms to ${matchedConsoleIds.size} RA consoles`
    );

    return consoles.filter(({ id }) => matchedConsoleIds.has(id));
  }

  onModuleInit() {
    this.conflicts.register({
      source: "ra",
      direction: "games",
      isMultiMatch: true,
      linkField: "retroachievements.gameId",
      describe: (raId, data) => this.describeConflict(raId, data),
      apply: (decisions) => this.applyConflictDecisions(decisions),
      rematch: (raId, data) => this.rematchConflict(raId, data),
      undo: ({ externalId, winners }) =>
        this.games
          .updateMany(
            { _id: { $in: winners } },
            { $pull: { retroachievements: { gameId: Number(externalId) } } }
          )
          .then(() => undefined),
    });
  }

  private toConflictRecord(
    raGame: TRaSet,
    ranked: TRaRanked<GameDocument>[],
    reason: IMatchReason | null = "competing-candidates"
  ): IConflictRecord {
    const hasSeveralTitles = raGame.title.includes("|");

    return {
      externalId: String(raGame.id),
      externalName: raGame.title,
      externalData: this.toSnapshot(raGame),
      reason,
      candidates: ranked.map(({ game, score, matchedTitle, scored }) =>
        scored
          ? { ...scored, matchedTitle: hasSeveralTitles ? matchedTitle : null }
          : {
              game: game as unknown as TMatchCandidate,
              matchedTitle: hasSeveralTitles ? matchedTitle : null,
              score: Math.round(score * 100) / 100,
              dateSignal: "unknown",
              breakdown: {
                title: Math.round(score * 100) / 100,
                companies: 0,
                date: 0,
                platforms: 0,
                genre: 0,
                type: 0,
              },
              isDistinctiveTitle: false,
              isMainTitleMatch: false,
              isCorroborated: false,
              isContradicted: false,
              hasCompanyMismatch: false,
              descriptionSignal: "unknown" as const,
            }
      ),
    };
  }

  private async rematchConflict(
    raId: string,
    data: Record<string, unknown> | null
  ) {
    const raGame = this.fromSnapshot(raId, data);

    if (!raGame) return null;

    const platforms = await this.platforms
      .find({ raId: raGame.consoleId })
      .select("_id slug raId")
      .lean();
    const candidates = (await this.games
      .find({ platformIds: { $in: platforms.map(({ _id }) => _id) } })
      .select(RA_USE_MATCH_ENGINE ? RA_ENGINE_GAME_FIELDS : "name slug")
      .lean()) as unknown as GameDocument[];

    if (!RA_USE_MATCH_ENGINE) {
      return this.toConflictRecord(
        raGame,
        rankGamesByTitle(raGame.title, candidates)
      ).candidates;
    }

    const picked = createRaEnginePicker(buildRaPlatformMaps(platforms))(
      raGame,
      candidates
    );

    return this.toConflictRecord(raGame, picked.ranked, picked.reason)
      .candidates;
  }

  private async describeConflict(
    raId: string,
    data: Record<string, unknown> | null
  ): Promise<IConflictSubject | null> {
    const raGame = this.fromSnapshot(raId, data);

    if (!raGame) return null;

    const platforms = await this.platforms
      .find({ raId: raGame.consoleId })
      .select("_id")
      .lean();
    const [name, ...alternativeNames] = raGame.title.split("|");

    return {
      name,
      originalName: name,
      alternativeNames,
      description: `${raGame.consoleName} · ${raGame.numAchievements} achievements`,
      released: null,
      developers: [],
      platformIds: platforms.map(({ _id }) => String(_id)),
      lengthMinutes: null,
      cover: raGame.imageBoxArt ? `${RA_MEDIA_URL}${raGame.imageBoxArt}` : null,
      isExplicitCover: false,
      url: `https://retroachievements.org/game/${raGame.id}`,
    };
  }

  private async applyConflictDecisions(
    decisions: IConflictDecision[]
  ): Promise<Map<string, mongoose.Types.ObjectId | null>> {
    const applied = new Map<string, mongoose.Types.ObjectId | null>();

    for (const { externalId, externalData, decision, winners } of decisions) {
      const raGame = this.fromSnapshot(externalId, externalData);

      if (!raGame) continue;

      if (decision === "skip") {
        applied.set(externalId, null);
        continue;
      }

      if (!winners.length) continue;

      await this.games.updateMany(
        { _id: { $in: winners } },
        { $pull: { retroachievements: { gameId: raGame.id } } }
      );
      const { matchedCount } = await this.games.updateMany(
        { _id: { $in: winners } },
        { $push: { retroachievements: toRaSetEntry(raGame) } }
      );

      if (matchedCount) applied.set(externalId, winners[0]);
    }

    return applied;
  }

  async parseGame(gameId: string, rawRaId?: string) {
    if (!mongoose.isValidObjectId(gameId)) {
      throw new BadRequestException(`Invalid game id: ${gameId}`);
    }

    const raId = rawRaId?.trim() ? Number(rawRaId) : undefined;

    if (raId !== undefined && (!Number.isInteger(raId) || raId <= 0)) {
      throw new BadRequestException(`Invalid RetroAchievements id: ${rawRaId}`);
    }

    const game = await this.games
      .findById(gameId)
      .select("_id slug name retroachievements")
      .lean();

    if (!game) throw new NotFoundException(`Game not found: ${gameId}`);

    const raIds =
      raId !== undefined
        ? [raId]
        : (game.retroachievements ?? []).map((entry) => entry.gameId);

    if (!raIds.length) {
      throw new BadRequestException(
        "The game has no RetroAchievements id to parse"
      );
    }

    const authorization = this.buildAuth();
    const entries: IRetroachievementsField[] = [];

    for (const id of raIds) {
      let raGame: TRaSet;

      try {
        raGame = await getGameExtended(authorization, { gameId: id });
      } catch {
        throw new NotFoundException(`RetroAchievements game not found: ${id}`);
      }

      if (!raGame?.title) {
        throw new NotFoundException(`RetroAchievements game not found: ${id}`);
      }

      entries.push(toRaSetEntry(raGame));

      if (raId !== undefined) {
        await this.conflicts.pin("ra", [String(id)], game._id);
        await this.conflicts.setExternalData("ra", [
          { externalId: String(id), externalData: this.toSnapshot(raGame) },
        ]);
      }
    }

    const fetchedIds = new Set(entries.map((entry) => entry.gameId));
    const retroachievements = [
      ...(game.retroachievements ?? []).filter(
        (entry) => !fetchedIds.has(entry.gameId)
      ),
      ...entries,
    ];

    await this.games.updateOne(
      { _id: game._id },
      {
        $set: { retroachievements, updatedAt: new Date().toISOString() },
      }
    );

    if (raId !== undefined) {
      const winners =
        (await this.conflicts.getResolutions("ra")).get(String(raId))
          ?.winners ?? [];

      await this.games.updateMany(
        { _id: { $nin: winners }, "retroachievements.gameId": raId },
        { $pull: { retroachievements: { gameId: raId } } }
      );
      await this.conflicts.removeForGame("ra", game._id, {
        keepExternalIds: [String(raId)],
      });
    }

    const message =
      raId !== undefined
        ? `Linked "${game.name}" to RetroAchievements ${raId} (${entries[0].consoleName}, ${entries[0].numAchievements} achievements)`
        : `Refreshed ${entries.length} RetroAchievements sets for "${game.name}"`;

    this.logger.info(message);

    return { status: "updated" as const, message, slug: game.slug };
  }

  async sync() {
    try {
      const authorization = this.buildAuth();
      const consoles = await getConsoleIds(authorization);
      const matchedConsoles = await this.matchConsolesToPlatforms(consoles);
      const raGames = await this.fetchAllGames(authorization, matchedConsoles);
      const result = await this.matchGames(authorization, raGames);

      await this.fillMissingSetData(authorization, raGames);

      return result;
    } catch (err) {
      this.logger.error(err, "Failed to sync RA games");
      throw err;
    }
  }

  private async fillMissingSetData(
    authorization: AuthObject,
    raGames: TRaSet[]
  ) {
    const missing = await this.games
      .aggregate<{ _id: number }>([
        { $unwind: "$retroachievements" },
        { $match: { "retroachievements.consoleName": { $exists: false } } },
        { $group: { _id: "$retroachievements.gameId" } },
      ])
      .exec();

    if (!missing.length) return;

    const fetchedById = new Map(raGames.map((raGame) => [raGame.id, raGame]));
    let lookups = 0;
    let filled = 0;

    for (const { _id: raId } of missing) {
      let raGame = fetchedById.get(raId);

      if (!raGame && lookups < RA_MISSING_SET_LOOKUPS) {
        lookups += 1;

        try {
          raGame = await getGameExtended(authorization, { gameId: raId });
        } catch {
          raGame = undefined;
        }

        await sleep(RA_GAMES_FETCH_DELAY_MS);
      }

      if (!raGame?.title) continue;

      const { consoleName, imageIcon, numAchievements } = toRaSetEntry(raGame);

      await this.games.updateMany(
        { "retroachievements.gameId": raId },
        {
          $set: {
            "retroachievements.$[set].consoleName": consoleName,
            ...(imageIcon && {
              "retroachievements.$[set].imageIcon": imageIcon,
            }),
            "retroachievements.$[set].numAchievements": numAchievements,
          },
        },
        { arrayFilters: [{ "set.gameId": raId }] }
      );
      filled += 1;
    }

    this.logger.info(
      `Filled RA set data for ${filled} of ${missing.length} sets missing it (${lookups} looked up one by one)`
    );
  }

  private async matchGames(authorization: AuthObject, raGames: TRaSet[]) {
    const platforms = await this.platforms.find();
    const games = await this.games
      .find()
      .select(
        RA_USE_MATCH_ENGINE
          ? RA_ENGINE_GAME_FIELDS
          : "name slug platformIds retroachievements"
      );
    const resolutions = await this.conflicts.getResolutions("ra");

    await this.conflicts.setExternalData(
      "ra",
      raGames
        .filter((raGame) => resolutions.has(String(raGame.id)))
        .map((raGame) => ({
          externalId: String(raGame.id),
          externalData: this.toSnapshot(raGame),
        }))
    );

    const { gameIds, ambiguous: unsure } = matchRaSets({
      raGames,
      games,
      platforms,
      resolutions,
      pick: RA_USE_MATCH_ENGINE
        ? createRaEnginePicker(buildRaPlatformMaps(platforms))
        : undefined,
    });
    const ambiguous = unsure.map(({ raGame, ranked, reason }) =>
      this.toConflictRecord(raGame, ranked, reason)
    );

    for (const record of ambiguous) {
      try {
        const { imageBoxArt } = await getGame(authorization, {
          gameId: Number(record.externalId),
        });

        if (imageBoxArt) {
          record.externalData = { ...record.externalData, cover: imageBoxArt };
        }
      } catch (err) {
        this.logger.warn(
          err,
          `Failed to fetch RA box art for ${record.externalId}`
        );
      }

      await sleep(RA_GAMES_FETCH_DELAY_MS);
    }

    await this.conflicts.record("ra", ambiguous);

    this.logger.info(
      `Matched ${Object.values(gameIds).flat().length} RA games to ${Object.keys(gameIds).length} games, ${ambiguous.length} ambiguous RA games sent to conflicts`
    );

    const raSyncResult = await this.games.bulkWrite(
      Object.keys(gameIds).map((key) => ({
        updateOne: {
          filter: {
            _id: key,
          },
          update: { $set: { retroachievements: gameIds[key] } },
        },
      }))
    );

    const linkedRaIds = Object.values(gameIds)
      .flat()
      .map(({ gameId }) => gameId);
    const unlinked = await this.games.updateMany(
      {
        "retroachievements.gameId": { $in: linkedRaIds },
        _id: {
          $nin: Object.keys(gameIds).map(
            (id) => new mongoose.Types.ObjectId(id)
          ),
        },
      },
      { $pull: { retroachievements: { gameId: { $in: linkedRaIds } } } }
    );

    this.logger.info(
      `Removed RA links now owned by other games from ${unlinked.modifiedCount} games`
    );

    this.metrics.recordGames(
      "ra",
      "updated",
      (raSyncResult.modifiedCount ?? 0) + unlinked.modifiedCount
    );

    this.logger.info("RA games sync finished");
    return "Success";
  }

  @Cron(RA_SYNC_CRON, RA_SYNC_CRON_OPTIONS)
  async syncCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "ra-sync", () =>
        this.metrics.trackSync("ra-sync", () => this.runSyncCron())
      )
    );
  }

  private async runSyncCron() {
    if (this.isSyncRunning) {
      this.logger.warn("RA sync cron is already running");
      return;
    }

    this.isSyncRunning = true;

    try {
      const result = await this.sync();
      await this.parseUsersAwards();

      this.logger.info("RA sync cron finished");
      return result;
    } catch (err) {
      this.logger.error(err, "Failed to run RA sync cron");
      throw err;
    } finally {
      this.isSyncRunning = false;
    }
  }

  async parseUsersAwards() {
    try {
      const authorization = this.buildAuth();
      const users = await this.users.find({
        raUsername: { $exists: true, $ne: null },
      });

      let updated = 0;

      for (const user of users) {
        try {
          const userAwards = await getUserAwards(authorization, {
            username: user.raUlid ?? user.raUsername,
          });

          user.raAwards = userAwards.visibleUserAwards;
          user.raSyncedAt = new Date().toISOString();
          await user.save();
          await this.raPlaythroughs.sync(user._id as mongoose.Types.ObjectId);
          updated++;
        } catch (err) {
          this.logger.error(
            err,
            `Failed to parse RA awards for user: ${user.raUsername}`
          );
        }

        await sleep(RA_AWARDS_FETCH_DELAY_MS);
      }

      this.logger.info(`Parsed RA awards for ${updated}/${users.length} users`);

      return `Parsed RA awards for ${updated}/${users.length} users`;
    } catch (err) {
      this.logger.error(err, "Failed to parse RA awards for all users");
      throw err;
    }
  }
}
