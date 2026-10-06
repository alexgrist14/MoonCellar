import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import mongoose, { Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import type { ISteamProgress } from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";
import { sleep } from "../../../shared/utils";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import { SteamPlaythroughsService } from "./steam-playthroughs.service";
import {
  STEAM_PROGRESS_APPS_PER_REQUEST,
  STEAM_PROGRESS_CRON,
  STEAM_PROGRESS_CRON_OPTIONS,
  STEAM_PROGRESS_MASTERED_LOOKUPS,
  STEAM_PROGRESS_USER_DELAY_MS,
} from "../constants/steam-progress";
import { STEAM_ACHIEVEMENTS_TIMEOUT_MS } from "../constants/steam-achievements";

const OWNED_URL =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
const TOP_ACHIEVEMENTS_URL =
  "https://api.steampowered.com/IPlayerService/GetTopAchievementsForGames/v1/";
const PLAYER_ACHIEVEMENTS_URL =
  "https://api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1/";
const MAX_ACHIEVEMENTS = 10000;

type TAppProgress = { appId: number; unlocked: number; total: number };

export const readTopAchievements = (body: unknown): TAppProgress[] =>
  (
    (
      body as {
        response?: {
          games?: {
            appid: number;
            total_achievements?: number;
            achievements?: unknown[];
          }[];
        };
      }
    )?.response?.games ?? []
  ).map((game) => ({
    appId: game.appid,
    total: game.total_achievements ?? 0,
    unlocked: game.achievements?.length ?? 0,
  }));

export const readLastUnlock = (body: unknown): string | null => {
  const achievements =
    (
      body as {
        playerstats?: {
          achievements?: { achieved: number; unlocktime: number }[];
        };
      }
    )?.playerstats?.achievements ?? [];
  const last = Math.max(
    0,
    ...achievements
      .filter(({ achieved }) => achieved)
      .map(({ unlocktime }) => unlocktime)
  );

  return last ? new Date(last * 1000).toISOString() : null;
};

@Injectable()
export class SteamProgressService {
  private readonly apiKey = process.env.STEAM_API_KEY;

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    private readonly playthroughs: SteamPlaythroughsService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(SteamProgressService.name);
  }

  private async getJson(url: string) {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(STEAM_ACHIEVEMENTS_TIMEOUT_MS),
    });

    if (!response.ok) {
      throw new Error(`Steam answered ${response.status}`);
    }

    return response.json();
  }

  private async fetchOwnedAppIds(steamId: string) {
    const body = (await this.getJson(
      `${OWNED_URL}?key=${this.apiKey}&steamid=${steamId}&include_played_free_games=1`
    )) as { response?: { games?: { appid: number }[] } };

    return (body.response?.games ?? []).map(({ appid }) => appid);
  }

  private async fetchProgress(steamId: string, appIds: number[]) {
    const progress: TAppProgress[] = [];

    for (let i = 0; i < appIds.length; i += STEAM_PROGRESS_APPS_PER_REQUEST) {
      const batch = appIds.slice(i, i + STEAM_PROGRESS_APPS_PER_REQUEST);
      const apps = batch
        .map((appId, index) => `appids%5B${index}%5D=${appId}`)
        .join("&");

      progress.push(
        ...readTopAchievements(
          await this.getJson(
            `${TOP_ACHIEVEMENTS_URL}?key=${this.apiKey}&steamid=${steamId}&max_achievements=${MAX_ACHIEVEMENTS}&${apps}`
          )
        )
      );
    }

    return progress;
  }

  private async fetchMasteredAt(steamId: string, appId: number) {
    try {
      return readLastUnlock(
        await this.getJson(
          `${PLAYER_ACHIEVEMENTS_URL}?key=${this.apiKey}&steamid=${steamId}&appid=${appId}`
        )
      );
    } catch {
      return null;
    }
  }

  private async mapToGames(appIds: number[]) {
    const games = await this.games
      .find({
        externalPages: {
          $elemMatch: { name: "Steam", uid: { $in: appIds.map(String) } },
        },
      })
      .select("_id externalPages")
      .lean();
    const byAppId = new Map<string, string>();

    for (const game of games) {
      const uid = game.externalPages?.find(({ name }) => name === "Steam")?.uid;

      if (uid && !byAppId.has(uid)) byAppId.set(uid, String(game._id));
    }

    return byAppId;
  }

  async syncUser(
    userId: mongoose.Types.ObjectId | string,
    known?: {
      appIds: number[];
      gameIdByAppId: Map<string, mongoose.Types.ObjectId>;
    }
  ) {
    if (!this.apiKey) return null;

    const user = await this.users.findById(userId).select("steam");
    const steamId = user?.steam?.steamId;

    if (!user?.steam || !steamId) return null;

    const appIds = known?.appIds ?? (await this.fetchOwnedAppIds(steamId));
    const progress = (await this.fetchProgress(steamId, appIds)).filter(
      ({ unlocked, total }) => unlocked > 0 && total > 0
    );
    const fromSteamPages = await this.mapToGames(
      progress.map(({ appId }) => appId)
    );
    const previous = new Map(
      (user.steam.achievements ?? []).map((entry) => [entry.appId, entry])
    );
    let lookups = 0;
    const achievements: ISteamProgress[] = [];

    for (const { appId, unlocked, total } of progress) {
      const isMastered = unlocked >= total;
      let masteredAt = isMastered
        ? (previous.get(appId)?.masteredAt ?? null)
        : null;

      if (
        isMastered &&
        !masteredAt &&
        lookups < STEAM_PROGRESS_MASTERED_LOOKUPS
      ) {
        lookups += 1;
        masteredAt = await this.fetchMasteredAt(steamId, appId);
      }

      achievements.push({
        appId,
        gameId:
          (known?.gameIdByAppId.get(String(appId)) &&
            String(known.gameIdByAppId.get(String(appId)))) ||
          fromSteamPages.get(String(appId)) ||
          null,
        unlocked,
        total,
        masteredAt,
      });
    }

    user.steam.achievements = achievements;
    user.steam.achievementsSyncedAt = new Date();
    user.markModified("steam");
    await user.save();

    await this.playthroughs.sync(user._id as mongoose.Types.ObjectId);

    return {
      withProgress: achievements.length,
      mastered: achievements.filter(({ unlocked, total }) => unlocked >= total)
        .length,
    };
  }

  @Cron(STEAM_PROGRESS_CRON, STEAM_PROGRESS_CRON_OPTIONS)
  async syncCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "steam-progress-sync", async () => {
        const lock = await withDbLock(
          this.users.db,
          "steam-progress-sync",
          () => this.syncAll()
        );

        if (!lock.locked) {
          this.logger.warn("Steam progress sync is already running");
        }
      })
    );
  }

  private async syncAll() {
    const users = await this.users
      .find({ "steam.steamId": { $exists: true } })
      .select("_id")
      .lean();
    let updated = 0;

    for (const { _id } of users) {
      try {
        if (await this.syncUser(_id as mongoose.Types.ObjectId)) updated += 1;
      } catch (err) {
        this.logger.warn(
          `Steam progress failed for user ${String(_id)}: ${(err as Error).message}`
        );
      }

      await sleep(STEAM_PROGRESS_USER_DELAY_MS);
    }

    this.logger.info(
      `Steam progress sync finished: ${updated}/${users.length} users`
    );
  }
}
