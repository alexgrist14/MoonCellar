import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  type AuthObject,
  buildAuthorization,
  type FetchedSystem,
  type GameList,
  getConsoleIds,
  getGameList,
  getUserAwards,
} from "@retroachievements/api";
import mongoose, { Model } from "mongoose";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { updateOrInsertValues } from "../../../shared/db";
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
import { RAConsole } from "../schemas/console.schema";
import { RAGame } from "../schemas/retroach.schema";
import type { IConflictSubject } from "@mooncellar/schemas";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type {
  IConflictDecision,
  IConflictRecord,
} from "../../conflicts/types/conflicts.types";
import type { TMatchCandidate } from "../../games/matching/game-matcher.types";
import {
  RA_AMBIGUITY_GAP,
  RA_AWARDS_FETCH_DELAY_MS,
  RA_CONSOLE_BY_PLATFORM_SLUG,
  RA_GAMES_FETCH_DELAY_MS,
  RA_SYNC_CRON,
  RA_SYNC_CRON_OPTIONS,
} from "../constants/sync";
import {
  matchPlatformToConsole,
  pickExactTitleMatch,
  rankGamesByTitle,
} from "../utils/retroach.utils";

const RA_MEDIA_URL = "https://media.retroachievements.org";

@Injectable()
export class RetroachievementsService implements OnModuleInit {
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
    private readonly metrics: BusinessMetricsService,
    private readonly conflicts: ConflictsService
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
        const slugConsoleId = RA_CONSOLE_BY_PLATFORM_SLUG[platform.slug];
        const match =
          slugConsoleId == null
            ? matchPlatformToConsole(platform.name, consoles)
            : consoles.find(({ _id }) => _id === slugConsoleId);
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

  onModuleInit() {
    this.conflicts.register({
      source: "ra",
      direction: "games",
      isMultiMatch: true,
      linkField: "retroachievements.gameId",
      describe: (raId) => this.describeConflict(raId),
      apply: (decisions) => this.applyConflictDecisions(decisions),
      rematch: (raId) => this.rematchConflict(raId),
    });
  }

  private toConflictRecord(
    raGame: Pick<RAGame, "_id" | "title">,
    ranked: { game: GameDocument; score: number; matchedTitle: string }[]
  ): IConflictRecord {
    const hasSeveralTitles = raGame.title.includes("|");

    return {
      externalId: String(raGame._id),
      externalName: raGame.title,
      reason: "competing-candidates",
      candidates: ranked.map(({ game, score, matchedTitle }) => ({
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
        descriptionSignal: "unknown",
      })),
    };
  }

  private async rematchConflict(raId: string) {
    const raGame = await this.gameModel
      .findById(Number(raId))
      .select("_id title consoleId")
      .lean();

    if (!raGame) return null;

    const platforms = await this.platforms
      .find({ raId: raGame.consoleId })
      .select("_id")
      .lean();
    const candidates = await this.games
      .find({ platformIds: { $in: platforms.map(({ _id }) => _id) } })
      .select("name slug")
      .lean();

    return this.toConflictRecord(
      raGame,
      rankGamesByTitle(raGame.title, candidates as GameDocument[])
    ).candidates;
  }

  private async describeConflict(
    raId: string
  ): Promise<IConflictSubject | null> {
    const raGame = await this.gameModel.findById(Number(raId)).lean();

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
      description: `${raGame.consoleName} · ${raGame.numAchievements ?? 0} achievements`,
      released: null,
      developers: [],
      platformIds: platforms.map(({ _id }) => String(_id)),
      lengthMinutes: null,
      cover: raGame.imageIcon ? `${RA_MEDIA_URL}${raGame.imageIcon}` : null,
      isExplicitCover: false,
      url: `https://retroachievements.org/game/${raGame._id}`,
    };
  }

  private async applyConflictDecisions(
    decisions: IConflictDecision[]
  ): Promise<Map<string, mongoose.Types.ObjectId | null>> {
    const applied = new Map<string, mongoose.Types.ObjectId | null>();

    for (const { externalId, decision, winners } of decisions) {
      const raGame = await this.gameModel
        .findById(Number(externalId))
        .select("_id consoleId")
        .lean();

      if (!raGame) continue;

      if (decision === "skip") {
        applied.set(externalId, null);
        continue;
      }

      if (!winners.length) continue;

      const { matchedCount } = await this.games.updateMany(
        { _id: { $in: winners } },
        {
          $addToSet: {
            retroachievements: {
              gameId: raGame._id,
              consoleId: raGame.consoleId,
            },
          },
        }
      );

      if (matchedCount) applied.set(externalId, winners[0]);
    }

    return applied;
  }

  async parseRAGames() {
    try {
      const raGames = await this.gameModel.find();
      const platforms = await this.platforms.find();
      const games = await this.games.find().select("name slug platformIds");
      const resolutions = await this.conflicts.getResolutions("ra");
      const ambiguous: IConflictRecord[] = [];

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

        const resolution = resolutions.get(String(raGame._id));
        let matches: { _id: mongoose.Types.ObjectId }[] = [];

        if (resolution) {
          if (resolution.status !== "resolved") continue;

          matches = resolution.winners.map((_id) => ({ _id }));
        } else {
          const ranked = rankGamesByTitle(raGame.title, candidates);
          const [best, runnerUp] = ranked;

          if (!best) continue;

          if (
            runnerUp &&
            runnerUp.game._id.toString() !== best.game._id.toString() &&
            best.score - runnerUp.score < RA_AMBIGUITY_GAP
          ) {
            const exact = pickExactTitleMatch(raGame.title, ranked);

            if (!exact) {
              ambiguous.push(this.toConflictRecord(raGame, ranked));
              continue;
            }

            matches = [exact];
          } else {
            matches = [best.game];
          }
        }

        for (const match of matches) {
          const id = match._id.toString();
          const value = { gameId: raGame._id, consoleId: raGame.consoleId };
          const list = gameIds[id];

          list ? list.push(value) : (gameIds[id] = [value]);
        }
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
