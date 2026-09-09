import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  AuthObject,
  buildAuthorization,
  FetchedSystem,
  GameList,
  getConsoleIds,
  getGameList,
  getUserAwards,
} from "@retroachievements/api";
import mongoose, { Model } from "mongoose";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { updateOrInsertValues } from "src/shared/db";
import { sleep } from "src/shared/utils";
import { runInCronLogContext } from "src/shared/cron-logging";
import { runCronExclusive } from "src/shared/cron-mutex";
import { BusinessMetricsService } from "src/module/metrics/business-metrics.service";

import { Game, GameDocument } from "src/module/games/schemas/game.schema";
import {
  Platform,
  PlatformDocument,
} from "src/module/games/schemas/platform.schema";
import { User } from "src/module/user/schemas/user.schema";
import { RA_MAIN_USER_NAME } from "src/shared/constants";
import { RAConsole } from "../schemas/console.schema";
import { RAGame } from "../schemas/retroach.schema";
import {
  RA_AWARDS_FETCH_DELAY_MS,
  RA_GAMES_FETCH_DELAY_MS,
  RA_SYNC_CRON,
  RA_SYNC_CRON_OPTIONS,
} from "../constants/sync";
import {
  matchGameByTitle,
  matchPlatformToConsole,
} from "../utils/retroach.utils";

@Injectable()
export class RetroachievementsService {
  private isSyncRunning = false;
  private readonly userName = RA_MAIN_USER_NAME;
  private readonly apiKey = process.env.RETROACHIEVEMENTS_API_KEY;

  constructor(
    @InjectModel(RAGame.name) private gameModel: Model<RAGame>,
    @InjectModel(RAConsole.name)
    private consoleModel: Model<RAConsole>,
    @InjectModel(Game.name)
    private games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private platforms: Model<PlatformDocument>,
    @InjectModel(User.name)
    private users: Model<User>,
    private readonly logger: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {
    this.logger.setContext(RetroachievementsService.name);
  }

  private buildAuth(): AuthObject {
    return buildAuthorization({
      username: this.userName,
      webApiKey: this.apiKey,
    });
  }

  async parse(type: "consoles" | "games" | "both") {
    try {
      const authorization = this.buildAuth();
      const consoles = await getConsoleIds(authorization);

      if (type === "consoles") {
        return updateOrInsertValues(this.consoleModel, consoles);
      }

      if (type === "both") {
        await updateOrInsertValues(this.consoleModel, consoles);
      }

      const games = await this.fetchAllGames(authorization, consoles);

      return updateOrInsertValues(this.gameModel, games);
    } catch (err) {
      this.logger.error(err, `Failed to parse: ${type}`);
      throw err;
    }
  }

  private async fetchAllGames(
    authorization: AuthObject,
    consoles: FetchedSystem[]
  ): Promise<GameList> {
    const games: GameList = [];

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

  async matchConsolesToPlatforms() {
    try {
      const consoles = await this.consoleModel.find();
      const platforms = await this.platforms.find();

      const moonIdsByConsoleId = new Map<number, mongoose.Types.ObjectId[]>();
      const platformOps = [];

      for (const platform of platforms) {
        const match = matchPlatformToConsole(platform.name, consoles);
        if (!match) continue;

        const moonIdList = moonIdsByConsoleId.get(match._id);
        moonIdList
          ? moonIdList.push(platform._id)
          : moonIdsByConsoleId.set(match._id, [platform._id]);

        platformOps.push({
          updateOne: {
            filter: { _id: platform._id },
            update: {
              $set: { raId: match._id, updateAt: new Date().toISOString() },
            },
          },
        });
      }

      const consoleOps = [...moonIdsByConsoleId.entries()].map(
        ([consoleId, moonId]) => ({
          updateOne: {
            filter: { _id: consoleId },
            update: { $set: { moonId } },
          },
        })
      );

      if (platformOps.length) {
        await this.platforms.bulkWrite(platformOps);
      }

      if (consoleOps.length) {
        await this.consoleModel.bulkWrite(consoleOps);
      }

      this.logger.info(
        `Matched ${platformOps.length} platforms to ${consoleOps.length} RA consoles`
      );

      return {
        matchedPlatforms: platformOps.length,
        matchedConsoles: consoleOps.length,
      };
    } catch (err) {
      this.logger.error(err, "Failed to match RA consoles to IGDB platforms");
      throw err;
    }
  }

  async parseRAGames() {
    try {
      const raGames = await this.gameModel.find();
      const platforms = await this.platforms.find();
      const games = await this.games.find().select("name platformIds");

      const platformsByRaId = new Map<number, PlatformDocument[]>();
      for (const platform of platforms) {
        if (platform.raId == null) continue;
        const list = platformsByRaId.get(platform.raId);
        list
          ? list.push(platform)
          : platformsByRaId.set(platform.raId, [platform]);
      }

      const gamesByPlatformId = new Map<string, GameDocument[]>();
      for (const game of games) {
        for (const platformId of game.platformIds ?? []) {
          const key = platformId.toString();
          const list = gamesByPlatformId.get(key);
          list ? list.push(game) : gamesByPlatformId.set(key, [game]);
        }
      }

      const gameIds: Record<string, { gameId: number; consoleId: number }[]> =
        {};

      for (const raGame of raGames) {
        const parsedPlatforms = platformsByRaId.get(raGame.consoleId);
        if (!parsedPlatforms?.length) continue;

        const seenIds = new Set<string>();
        const candidates: GameDocument[] = [];

        for (const platform of parsedPlatforms) {
          const platformGames =
            gamesByPlatformId.get(platform._id.toString()) ?? [];

          for (const game of platformGames) {
            const id = game._id.toString();
            if (!seenIds.has(id)) {
              seenIds.add(id);
              candidates.push(game);
            }
          }
        }

        const match = matchGameByTitle(raGame.title, candidates);
        if (!match) continue;

        const id = match._id.toString();
        const value = { gameId: raGame._id, consoleId: raGame.consoleId };
        const list = gameIds[id];

        list ? list.push(value) : (gameIds[id] = [value]);
      }

      this.logger.info(
        `Matched ${Object.values(gameIds).flat().length} RA games to ${Object.keys(gameIds).length} games`
      );

      const raSyncResult = await this.games.bulkWrite(
        Object.keys(gameIds).map((key) => ({
          updateOne: {
            filter: {
              _id: key,
            },
            update: [
              {
                $set: {
                  retroachievements: {
                    $cond: [
                      {
                        $ifNull: ["$raIds", false],
                      },
                      {
                        $setUnion: ["$raIds", gameIds[key]],
                      },
                      gameIds[key],
                    ],
                  },
                },
              },
            ],
          },
        }))
      );

      this.metrics.recordGames(
        "ra",
        "updated",
        raSyncResult.modifiedCount ?? 0
      );

      this.logger.info("RA games parsing finished");
      return "Success";
    } catch (err) {
      this.logger.error(err, `Failed to parse ra games`);
      throw err;
    }
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
      await this.parse("both");
      await this.matchConsolesToPlatforms();
      const result = await this.parseRAGames();
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

  async getUnrecognised() {}

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
            username: user.raUsername,
          });

          user.raAwards = userAwards.visibleUserAwards;
          await user.save();
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
