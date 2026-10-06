import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  ServiceUnavailableException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import axios from "axios";
import mongoose, { type Model } from "mongoose";
import {
  type ISteamAccount,
  type ISteamLoginUrlResponse,
  type ISteamSyncResponse,
  type IUnlinkSteamAccountResponse,
} from "@mooncellar/schemas";
import { FRONT_URL } from "../../../shared/constants";
import { Game } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";
import { SteamProgressService } from "./steam-progress.service";
import { SteamLibrary } from "../schemas/steam-library.schema";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { sleep } from "../../../shared/utils";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import {
  STEAM_PROGRESS_CRON,
  STEAM_PROGRESS_CRON_OPTIONS,
  STEAM_PROGRESS_USER_DELAY_MS,
} from "../constants/steam-progress";
import { CustomListsService } from "../../collections/services/custom-lists.service";
import {
  buildIgdbQueryParams,
  igdbAgent,
  igdbAuth,
} from "../../igdb/utils/igdb";
import { normalizeTitle } from "../../games/utils/title-match.utils";
import { pickSteamCandidate } from "../utils/steam-match.utils";
import {
  STEAM_OPENID_URL,
  buildSteamLoginUrl,
  getAssertedSteamId,
  isValidCheckAuthenticationResponse,
  pickOpenIdParams,
} from "../utils/steam-openid.utils";

const STEAM_OWNED_GAMES_URL =
  "https://api.steampowered.com/IPlayerService/GetOwnedGames/v1/";
const IGDB_EXTERNAL_GAMES_URL = "https://api.igdb.com/v4/external_games";
const IGDB_STEAM_SOURCE = 1;
const IGDB_UID_CHUNK = 200;
const IGDB_ROWS_LIMIT = 500;

interface ISteamOwnedGame {
  appid: number;
  name?: string;
  playtime_forever?: number;
  rtime_last_played?: number;
}

interface ISteamOwnedGamesResponse {
  response?: { game_count?: number; games?: ISteamOwnedGame[] };
}

const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number } | null)?.code === 11000;

@Injectable()
export class SteamAccountService {
  private readonly logger = new Logger(SteamAccountService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(Game.name) private readonly games: Model<Game>,
    @InjectModel(SteamLibrary.name)
    private readonly libraries: Model<SteamLibrary>,
    private readonly lists: CustomListsService,
    private readonly progress: SteamProgressService,
    private readonly pino: PinoLogger
  ) {}

  private getReturnTo(user: User) {
    return `${FRONT_URL}/user/${user.userName}/settings`;
  }

  private toAccount(user: User): ISteamAccount {
    const steam = user.steam!;

    return {
      steamId: steam.steamId,
      linkedAt: steam.linkedAt.toISOString(),
      syncedAt: steam.syncedAt ? steam.syncedAt.toISOString() : null,
      libraryCount: steam.libraryCount,
    };
  }

  getLoginUrl(user: User): ISteamLoginUrlResponse {
    return { url: buildSteamLoginUrl(this.getReturnTo(user)) };
  }

  async link(
    user: User,
    params: Record<string, string>
  ): Promise<ISteamSyncResponse> {
    const openIdParams = pickOpenIdParams(params);
    const steamId = getAssertedSteamId(openIdParams, this.getReturnTo(user));

    if (!steamId) {
      throw new BadRequestException("This is not a Steam sign-in response");
    }

    const { data } = await axios.post<string>(
      STEAM_OPENID_URL,
      new URLSearchParams({
        ...openIdParams,
        "openid.mode": "check_authentication",
      }).toString(),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        responseType: "text",
      }
    );

    if (!isValidCheckAuthenticationResponse(data)) {
      throw new BadRequestException("Steam did not confirm the sign-in");
    }

    if (user.steam?.steamId && user.steam.steamId !== steamId) {
      throw new ConflictException(
        "Unlink the current Steam account before linking another one"
      );
    }

    if (!user.steam?.steamId) {
      try {
        await this.users.updateOne(
          { _id: user._id },
          { $set: { steam: { steamId, linkedAt: new Date(), syncedAt: null } } }
        );
      } catch (err) {
        if (isDuplicateKeyError(err)) {
          throw new ConflictException(
            "This Steam account is linked to another MoonCellar profile"
          );
        }
        throw err;
      }
    }

    return this.sync(user._id as mongoose.Types.ObjectId);
  }

  async sync(userId: mongoose.Types.ObjectId): Promise<ISteamSyncResponse> {
    const user = await this.users.findById(userId).select("steam");

    if (!user?.steam?.steamId) {
      throw new NotFoundException("No Steam account is linked");
    }

    const owned = await this.getOwnedGames(user.steam.steamId);
    const byAppId = await this.matchGames(owned);
    const gameIds = owned
      .map((game) => byAppId.get(String(game.appid)))
      .filter((id): id is mongoose.Types.ObjectId => !!id);
    const unmatched = owned
      .filter((game) => !byAppId.has(String(game.appid)))
      .map((game) => ({
        appId: game.appid,
        name: game.name || `App ${game.appid}`,
      }));
    const seen = new Set<string>();

    await this.libraries.updateOne(
      { userId },
      {
        $set: {
          games: owned.flatMap((game) => {
            const gameId = byAppId.get(String(game.appid));

            if (!gameId || seen.has(String(gameId))) return [];

            seen.add(String(gameId));

            return [
              {
                appId: game.appid,
                gameId,
                playtime: game.playtime_forever ?? 0,
              },
            ];
          }),
          syncedAt: new Date(),
        },
      },
      { upsert: true }
    );
    await this.lists.deleteSourceList(userId, "steam");

    user.steam.syncedAt = new Date();
    user.steam.libraryCount = seen.size;
    user.markModified("steam");
    await user.save();

    await this.progress
      .syncUser(userId, {
        appIds: owned.map(({ appid }) => appid),
        gameIdByAppId: byAppId,
      })
      .catch((err: Error) =>
        this.logger.warn(
          `Steam achievements were not read for ${String(userId)}: ${err.message}`
        )
      );

    return {
      steam: this.toAccount(user),
      ownedCount: owned.length,
      matchedCount: gameIds.length,
      unmatched,
    };
  }

  async unlink(
    userId: mongoose.Types.ObjectId
  ): Promise<IUnlinkSteamAccountResponse> {
    await this.lists.deleteSourceList(userId, "steam");
    await this.libraries.deleteOne({ userId });
    await this.users.updateOne({ _id: userId }, { $unset: { steam: 1 } });

    return { isUnlinked: true };
  }

  @Cron(STEAM_PROGRESS_CRON, STEAM_PROGRESS_CRON_OPTIONS)
  async syncAllCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, "steam-library-sync", async () => {
        const lock = await withDbLock(this.users.db, "steam-library-sync", () =>
          this.syncAll()
        );

        if (!lock.locked) {
          this.logger.warn("Steam library sync is already running");
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
        await this.sync(_id as mongoose.Types.ObjectId);
        updated += 1;
      } catch (err) {
        this.logger.warn(
          `Steam library sync failed for user ${String(_id)}: ${(err as Error).message}`
        );
      }

      await sleep(STEAM_PROGRESS_USER_DELAY_MS);
    }

    this.logger.log(
      `Steam library sync finished: ${updated}/${users.length} users`
    );
  }

  private async getOwnedGames(steamId: string) {
    const key = process.env.STEAM_API_KEY;

    if (!key) {
      throw new ServiceUnavailableException("Steam import is not configured");
    }

    const { data } = await axios.get<ISteamOwnedGamesResponse>(
      STEAM_OWNED_GAMES_URL,
      {
        params: {
          key,
          steamid: steamId,
          include_played_free_games: 1,
          include_appinfo: 1,
          format: "json",
        },
      }
    );
    const games = data?.response?.games;

    if (!games) {
      throw new UnprocessableEntityException(
        "Steam hides this library. Set Game details to Public in your Steam privacy settings and try again"
      );
    }

    return [...games].sort(
      (a, b) =>
        (b.playtime_forever ?? 0) - (a.playtime_forever ?? 0) ||
        (b.rtime_last_played ?? 0) - (a.rtime_last_played ?? 0) ||
        a.appid - b.appid
    );
  }

  private async matchGames(owned: ISteamOwnedGame[]) {
    const uids = owned.map((game) => String(game.appid));
    const byUid = new Map<string, mongoose.Types.ObjectId>();

    const linked = await this.games
      .find({
        externalPages: {
          $elemMatch: { name: "Steam", uid: { $in: uids } },
        },
      })
      .select("_id name versionTitle type externalPages")
      .lean();

    const wanted = new Set(uids);
    const steamNames = new Map(
      owned.map((game) => [String(game.appid), game.name])
    );
    const candidatesByUid = new Map<string, typeof linked>();

    for (const game of linked) {
      for (const page of game.externalPages ?? []) {
        if (page.name === "Steam" && wanted.has(page.uid)) {
          candidatesByUid.set(page.uid, [
            ...(candidatesByUid.get(page.uid) ?? []),
            game,
          ]);
        }
      }
    }

    for (const [uid, candidates] of candidatesByUid) {
      const gameId = pickSteamCandidate(
        candidates.map((game) => ({ ...game, id: game._id })),
        steamNames.get(uid)
      );

      if (gameId) byUid.set(uid, gameId);
    }

    const missing = uids.filter((uid) => !byUid.has(uid));

    if (missing.length) {
      for (const [uid, gameId] of await this.matchThroughIgdb(
        missing,
        steamNames
      )) {
        if (!byUid.has(uid)) byUid.set(uid, gameId);
      }
    }

    const unnamed = owned.filter((game) => !byUid.has(String(game.appid)));

    if (unnamed.length) {
      for (const [uid, gameId] of await this.matchByName(unnamed)) {
        byUid.set(uid, gameId);
      }
    }

    return byUid;
  }

  private async matchByName(owned: ISteamOwnedGame[]) {
    const matches = new Map<string, mongoose.Types.ObjectId>();
    const names = new Map(
      owned
        .map(
          (game) =>
            [String(game.appid), normalizeTitle(game.name ?? "")] as const
        )
        .filter(([, name]) => !!name)
    );

    if (!names.size) return matches;

    const games = await this.games
      .find({ nameNormalized: { $in: [...new Set(names.values())] } })
      .select("_id nameNormalized")
      .lean();
    const byName = new Map<string, mongoose.Types.ObjectId[]>();

    for (const game of games) {
      byName.set(game.nameNormalized, [
        ...(byName.get(game.nameNormalized) ?? []),
        game._id,
      ]);
    }

    for (const [uid, name] of names) {
      const candidates = byName.get(name);

      if (candidates?.length === 1) matches.set(uid, candidates[0]);
    }

    return matches;
  }

  private async matchThroughIgdb(
    uids: string[],
    steamNames: Map<string, string | undefined>
  ) {
    const matches = new Map<string, mongoose.Types.ObjectId>();

    try {
      const {
        data: { access_token: token },
      } = await igdbAuth();
      const igdbIdsByUid = new Map<string, number[]>();

      for (let index = 0; index < uids.length; index += IGDB_UID_CHUNK) {
        const chunk = uids.slice(index, index + IGDB_UID_CHUNK);
        const { data } = await igdbAgent<{ game?: number; uid?: string }[]>(
          IGDB_EXTERNAL_GAMES_URL,
          token,
          buildIgdbQueryParams("game,uid", {
            where: `external_game_source = ${IGDB_STEAM_SOURCE} & uid = (${chunk
              .map((uid) => `"${uid}"`)
              .join(",")})`,
            limit: IGDB_ROWS_LIMIT,
          })
        );

        for (const { game, uid } of data ?? []) {
          if (game && uid) {
            igdbIdsByUid.set(uid, [...(igdbIdsByUid.get(uid) ?? []), game]);
          }
        }
      }

      if (!igdbIdsByUid.size) return matches;

      const games = await this.games
        .find({ "igdb.gameId": { $in: [...igdbIdsByUid.values()].flat() } })
        .select("_id name versionTitle type igdb.gameId")
        .lean();
      const byIgdbId = new Map(games.map((game) => [game.igdb?.gameId, game]));

      for (const [uid, igdbIds] of igdbIdsByUid) {
        const gameId = pickSteamCandidate(
          igdbIds
            .map((igdbId) => byIgdbId.get(igdbId))
            .filter((game) => !!game)
            .map((game) => ({ ...game, id: game._id })),
          steamNames.get(uid)
        );

        if (gameId) matches.set(uid, gameId);
      }
    } catch (err) {
      this.logger.warn(err, "IGDB lookup of Steam app ids failed");
    }

    return matches;
  }
}
