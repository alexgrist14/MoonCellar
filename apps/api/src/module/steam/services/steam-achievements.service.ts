import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import mongoose, { type FilterQuery, Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import { sleep } from "../../../shared/utils";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import {
  STEAM_ACHIEVEMENTS_BATCH_SIZE,
  STEAM_ACHIEVEMENTS_CRON,
  STEAM_ACHIEVEMENTS_CRON_OPTIONS,
  STEAM_ACHIEVEMENTS_DAILY_LIMIT,
  STEAM_ACHIEVEMENTS_DELAY_MS,
  STEAM_ACHIEVEMENTS_MAX_CONSECUTIVE_FAILURES,
  STEAM_ACHIEVEMENTS_STALE_DAYS,
  STEAM_ACHIEVEMENTS_TIMEOUT_MS,
} from "../constants/steam-achievements";

const SCHEMA_URL =
  "https://api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2/";

export class SteamAchievementsFailedError extends Error {}

type TSteamGame = {
  _id: mongoose.Types.ObjectId;
  name: string;
  externalPages?: { name?: string; uid?: string }[];
};

export type TSteamAchievementsResult = {
  status: "finished" | "aborted" | "skipped";
  processed: number;
  updated: number;
  failed: number;
};

export const getSteamAppId = (game: Pick<TSteamGame, "externalPages">) => {
  const uid = game.externalPages?.find(
    (page) => page.name === "Steam" && /^\d+$/.test(page.uid ?? "")
  )?.uid;

  return uid ? Number(uid) : null;
};

export const countSchemaAchievements = (body: unknown): number => {
  const achievements = (
    body as {
      game?: { availableGameStats?: { achievements?: unknown[] } };
    }
  )?.game?.availableGameStats?.achievements;

  return Array.isArray(achievements) ? achievements.length : 0;
};

@Injectable()
export class SteamAchievementsService {
  private readonly apiKey = process.env.STEAM_API_KEY;

  constructor(
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    private readonly logger: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {
    this.logger.setContext(SteamAchievementsService.name);
  }

  @Cron(STEAM_ACHIEVEMENTS_CRON, STEAM_ACHIEVEMENTS_CRON_OPTIONS)
  async syncCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "steam-achievements-sync", () =>
        this.metrics.trackSync("steam-achievements-sync", () =>
          this.sync({ limit: STEAM_ACHIEVEMENTS_DAILY_LIMIT })
        )
      )
    );
  }

  async sync({
    limit = STEAM_ACHIEVEMENTS_DAILY_LIMIT,
  }: { limit?: number } = {}): Promise<TSteamAchievementsResult> {
    const lock = await withDbLock(
      this.games.db,
      "steam-achievements-sync",
      () => this.run(limit)
    );

    if (!lock.locked) {
      this.logger.warn("Steam achievements sync is already running");
      return { status: "skipped", processed: 0, updated: 0, failed: 0 };
    }

    return lock.result;
  }

  async fetchTotal(appId: number): Promise<number> {
    if (!this.apiKey) {
      throw new SteamAchievementsFailedError("STEAM_API_KEY is not set");
    }

    const url = `${SCHEMA_URL}?key=${this.apiKey}&appid=${appId}`;
    let response: Response;

    try {
      response = await fetch(url, {
        signal: AbortSignal.timeout(STEAM_ACHIEVEMENTS_TIMEOUT_MS),
      });
    } catch (err) {
      throw new SteamAchievementsFailedError(
        `Steam request for app ${appId} failed: ${(err as Error).message}`
      );
    }

    if (response.status === 400) return 0;

    if (response.status === 403) {
      const body = await response.json().catch(() => null);

      if (body?.game) return countSchemaAchievements(body);
    }

    if (!response.ok) {
      throw new SteamAchievementsFailedError(
        `Steam answered ${response.status} for app ${appId}`
      );
    }

    return countSchemaAchievements(await response.json());
  }

  private buildFilter(): FilterQuery<GameDocument> {
    const staleBefore = new Date(
      Date.now() - STEAM_ACHIEVEMENTS_STALE_DAYS * 24 * 60 * 60 * 1000
    ).toISOString();

    return {
      externalPages: {
        $elemMatch: { name: "Steam", uid: { $regex: /^\d+$/ } },
      },
      $or: [
        { steamAchievements: { $exists: false } },
        { "steamAchievements.updatedAt": { $lt: staleBefore } },
      ],
    };
  }

  private async run(limit: number): Promise<TSteamAchievementsResult> {
    const filter = this.buildFilter();
    const result = { processed: 0, updated: 0, failed: 0 };
    let consecutiveFailures = 0;
    let isAborted = false;
    let lastId: mongoose.Types.ObjectId | null = null;
    let isMissingPass = true;

    this.logger.info(
      `Steam achievements sync started: ${await this.games.countDocuments(filter)} games due, limit ${limit}`
    );

    while (!isAborted && result.processed < limit) {
      const passFilter: FilterQuery<GameDocument> = isMissingPass
        ? { ...filter, steamAchievements: { $exists: false } }
        : { ...filter, steamAchievements: { $exists: true } };
      const games: TSteamGame[] = await this.games
        .find({ ...passFilter, ...(lastId && { _id: { $gt: lastId } }) })
        .select("_id name externalPages")
        .sort({ _id: 1 })
        .limit(
          Math.min(STEAM_ACHIEVEMENTS_BATCH_SIZE, limit - result.processed)
        )
        .lean();

      if (!games.length) {
        if (!isMissingPass) break;

        isMissingPass = false;
        lastId = null;
        continue;
      }

      const bulkOps = [];

      for (const game of games) {
        const appId = getSteamAppId(game);

        result.processed += 1;
        lastId = game._id;

        if (appId === null) continue;

        try {
          const total = await this.fetchTotal(appId);

          consecutiveFailures = 0;
          bulkOps.push({
            updateOne: {
              filter: { _id: game._id },
              update: {
                $set: {
                  steamAchievements: {
                    appId,
                    total,
                    updatedAt: new Date().toISOString(),
                  },
                },
              },
            },
          });
          result.updated += 1;
        } catch (err) {
          result.failed += 1;
          this.logger.warn(`${(err as Error).message} ("${game.name}")`);

          if (err instanceof SteamAchievementsFailedError) {
            consecutiveFailures += 1;

            if (
              consecutiveFailures >= STEAM_ACHIEVEMENTS_MAX_CONSECUTIVE_FAILURES
            ) {
              this.logger.error(
                `Steam achievements sync aborted: ${consecutiveFailures} requests failed in a row`
              );
              isAborted = true;
              break;
            }
          }
        }

        if (STEAM_ACHIEVEMENTS_DELAY_MS > 0) {
          await sleep(STEAM_ACHIEVEMENTS_DELAY_MS);
        }
      }

      if (bulkOps.length) await this.games.bulkWrite(bulkOps);

      this.logger.info(
        `Steam achievements sync progress: processed=${result.processed}, updated=${result.updated}, failed=${result.failed}`
      );
    }

    this.metrics.recordGames("steam-achievements", "updated", result.updated);
    this.logger.info(
      `Steam achievements sync ${isAborted ? "aborted" : "finished"}: processed=${result.processed}, updated=${result.updated}, failed=${result.failed}`
    );

    return { status: isAborted ? "aborted" : "finished", ...result };
  }

  async syncGame(gameId: string) {
    if (!mongoose.isValidObjectId(gameId)) return null;

    const game = await this.games
      .findById(gameId)
      .select("_id name externalPages")
      .lean<TSteamGame>();
    const appId = game && getSteamAppId(game);

    if (!game || appId === null) return null;

    const steamAchievements = {
      appId,
      total: await this.fetchTotal(appId),
      updatedAt: new Date().toISOString(),
    };

    await this.games.updateOne(
      { _id: game._id },
      { $set: { steamAchievements } }
    );

    return steamAchievements;
  }
}
