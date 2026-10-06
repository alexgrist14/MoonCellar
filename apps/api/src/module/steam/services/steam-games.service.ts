import { Injectable, type OnModuleInit } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import mongoose, { Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import type {
  IConflictSubject,
  IExternalPageField,
  ISteamGameField,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  Platform,
  type PlatformDocument,
} from "../../games/schemas/platform.schema";
import { normalizeTitle } from "../../games/utils/title-match.utils";
import type { TMatchCandidate } from "../../games/matching/game-matcher.types";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type {
  IConflictDecision,
  IConflictRecord,
} from "../../conflicts/types/conflicts.types";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import { mergeSteamStore } from "../utils/steam.utils";
import {
  buildSteamGamePayload,
  STEAM_PLATFORM_SLUGS,
  type ISteamAppDetails,
} from "../utils/steam-game-payload.utils";
import { GamesService } from "../../games/services/games.service";
import { uniqueSlug } from "../../../shared/utils";
import {
  STEAM_GAMES_CRON,
  STEAM_GAMES_CRON_OPTIONS,
  STEAM_GAMES_PAGE_SIZE,
  STEAM_PC_PLATFORM_SLUGS,
} from "../constants/steam-games";
import { STEAM_ACHIEVEMENTS_TIMEOUT_MS } from "../constants/steam-achievements";

const APP_LIST_URL =
  "https://api.steampowered.com/IStoreService/GetAppList/v1/";
const STORE_DETAILS_URL = "https://store.steampowered.com/api/appdetails";
const STEAM_ASSETS_URL =
  "https://shared.akamai.steamstatic.com/store_item_assets/steam/apps";

export type TSteamApp = { appid: number; name: string };

type TCatalogueGame = {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  nameNormalized?: string;
  platformIds?: mongoose.Types.ObjectId[];
  externalPages?: IExternalPageField[];
  steam?: ISteamGameField;
};

export const getSteamUid = (game: Pick<TCatalogueGame, "externalPages">) =>
  game.externalPages?.find(
    (page) => page.name === "Steam" && /^\d+$/.test(page.uid ?? "")
  )?.uid;

export const isAutoLinkable = (
  candidates: Pick<TCatalogueGame, "externalPages" | "platformIds">[],
  pcPlatformIds: Set<string>
) =>
  candidates.length === 1 &&
  !getSteamUid(candidates[0]) &&
  (candidates[0].platformIds ?? []).some((id) => pcPlatformIds.has(String(id)));

@Injectable()
export class SteamGamesService implements OnModuleInit {
  private readonly apiKey = process.env.STEAM_API_KEY;

  constructor(
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platforms: Model<PlatformDocument>,
    private readonly conflicts: ConflictsService,
    private readonly gamesService: GamesService,
    private readonly metrics: BusinessMetricsService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(SteamGamesService.name);
  }

  onModuleInit() {
    this.conflicts.register({
      source: "steam",
      direction: "games",
      linkField: "steam.appId",
      describe: (appId, data) => this.describeConflict(appId, data),
      apply: (decisions) => this.applyConflictDecisions(decisions),
    });
  }

  @Cron(STEAM_GAMES_CRON, STEAM_GAMES_CRON_OPTIONS)
  async syncCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "steam-games-sync", () =>
        this.metrics.trackSync("steam-games-sync", () => this.sync())
      )
    );
  }

  async sync() {
    const lock = await withDbLock(this.games.db, "steam-games-sync", () =>
      this.run()
    );

    if (!lock.locked) {
      this.logger.warn("Steam games sync is already running");
      return null;
    }

    return lock.result;
  }

  private async fetchCatalogue(): Promise<TSteamApp[]> {
    if (!this.apiKey) throw new Error("STEAM_API_KEY is not set");

    const apps: TSteamApp[] = [];
    let lastAppId = 0;

    for (;;) {
      const response = await fetch(
        `${APP_LIST_URL}?key=${this.apiKey}&include_games=true&max_results=${STEAM_GAMES_PAGE_SIZE}&last_appid=${lastAppId}`,
        { signal: AbortSignal.timeout(STEAM_ACHIEVEMENTS_TIMEOUT_MS * 4) }
      );

      if (!response.ok) {
        throw new Error(`Steam app list answered ${response.status}`);
      }

      const body = (await response.json()) as {
        response?: {
          apps?: TSteamApp[];
          have_more_results?: boolean;
          last_appid?: number;
        };
      };

      apps.push(...(body.response?.apps ?? []));

      if (!body.response?.have_more_results || !body.response.last_appid) {
        break;
      }

      lastAppId = body.response.last_appid;
    }

    return apps;
  }

  private toSteamField(app: TSteamApp): ISteamGameField {
    return {
      appId: app.appid,
      name: app.name,
      updatedAt: new Date().toISOString(),
    };
  }

  private linkUpdate(game: TCatalogueGame, app: TSteamApp) {
    return {
      updateOne: {
        filter: { _id: game._id },
        update: {
          $set: {
            steam: this.toSteamField(app),
            externalPages: mergeSteamStore(game.externalPages, {
              gameId: app.appid,
            }),
          },
        },
      },
    };
  }

  private toConflictRecord(
    app: TSteamApp,
    candidates: TCatalogueGame[]
  ): IConflictRecord {
    return {
      externalId: String(app.appid),
      externalName: app.name,
      externalData: { appId: app.appid, name: app.name },
      reason:
        candidates.length > 1 ? "competing-candidates" : "unverified-title",
      candidates: candidates.map((game) => ({
        game: game as unknown as TMatchCandidate,
        score: 1,
        dateSignal: "unknown",
        breakdown: {
          title: 1,
          companies: 0,
          date: 0,
          platforms: 0,
          genre: 0,
          type: 0,
        },
        isDistinctiveTitle: false,
        isMainTitleMatch: true,
        isCorroborated: false,
        isContradicted: false,
        hasCompanyMismatch: false,
        descriptionSignal: "unknown",
      })),
    };
  }

  private async getPcPlatformIds() {
    const platforms = await this.platforms
      .find({ slug: { $in: STEAM_PC_PLATFORM_SLUGS } })
      .select("_id")
      .lean();

    return new Set(platforms.map(({ _id }) => String(_id)));
  }

  private async run() {
    const apps = await this.fetchCatalogue();
    const appById = new Map(apps.map((app) => [String(app.appid), app]));
    const games: TCatalogueGame[] = await this.games
      .find()
      .select("_id name slug nameNormalized platformIds externalPages steam")
      .lean();
    const pcPlatformIds = await this.getPcPlatformIds();
    const resolutions = await this.conflicts.getResolutions("steam");
    const linkedUids = new Set<string>();
    const byName = new Map<string, TCatalogueGame[]>();
    const gameById = new Map(games.map((game) => [String(game._id), game]));
    const bulkOps: ReturnType<SteamGamesService["linkUpdate"]>[] = [];
    const directOps = [];
    const ambiguous: IConflictRecord[] = [];
    let autoLinked = 0;

    for (const game of games) {
      const uid = getSteamUid(game);

      if (uid) {
        linkedUids.add(uid);
        const app = appById.get(uid);

        if (
          app &&
          (game.steam?.appId !== app.appid || game.steam?.name !== app.name)
        ) {
          directOps.push({
            updateOne: {
              filter: { _id: game._id },
              update: { $set: { steam: this.toSteamField(app) } },
            },
          });
        }
      }

      const key = game.nameNormalized || normalizeTitle(game.name ?? "");

      if (key) byName.set(key, [...(byName.get(key) ?? []), game]);
    }

    await this.conflicts.setExternalData(
      "steam",
      apps
        .filter((app) => resolutions.has(String(app.appid)))
        .map((app) => ({
          externalId: String(app.appid),
          externalData: { appId: app.appid, name: app.name },
        }))
    );

    for (const app of apps) {
      const appId = String(app.appid);

      if (linkedUids.has(appId)) continue;

      const resolution = resolutions.get(appId);

      if (resolution) {
        if (resolution.status !== "resolved") continue;

        for (const winnerId of resolution.winners) {
          const game = gameById.get(String(winnerId));

          if (game && getSteamUid(game) !== appId) {
            bulkOps.push(this.linkUpdate(game, app));
          }
        }

        continue;
      }

      const candidates = byName.get(normalizeTitle(app.name)) ?? [];

      if (!candidates.length) continue;

      if (isAutoLinkable(candidates, pcPlatformIds)) {
        bulkOps.push(this.linkUpdate(candidates[0], app));
        linkedUids.add(appId);
        autoLinked += 1;
        continue;
      }

      ambiguous.push(this.toConflictRecord(app, candidates));
    }

    if (directOps.length) await this.games.bulkWrite(directOps);
    if (bulkOps.length) await this.games.bulkWrite(bulkOps);
    await this.conflicts.record("steam", ambiguous);

    this.metrics.recordGames(
      "steam",
      "updated",
      directOps.length + bulkOps.length
    );

    const summary = {
      apps: apps.length,
      directLinks: directOps.length,
      autoLinked,
      pinned: bulkOps.length - autoLinked,
      conflicts: ambiguous.length,
    };

    this.logger.info(`Steam games sync finished: ${JSON.stringify(summary)}`);

    return summary;
  }

  private fromSnapshot(
    appId: string,
    data: Record<string, unknown> | null
  ): TSteamApp | null {
    if (!data || typeof data.name !== "string") return null;

    return { appid: Number(appId), name: data.name };
  }

  private async describeConflict(
    appId: string,
    data: Record<string, unknown> | null
  ): Promise<IConflictSubject | null> {
    const app = this.fromSnapshot(appId, data);

    if (!app) return null;

    return {
      name: app.name,
      originalName: app.name,
      alternativeNames: [],
      description: "",
      released: null,
      developers: [],
      platformIds: [...(await this.getPcPlatformIds())],
      lengthMinutes: null,
      cover: `https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/${app.appid}/header.jpg`,
      isExplicitCover: false,
      url: `https://store.steampowered.com/app/${app.appid}`,
    };
  }

  private async fetchDetails(appId: number): Promise<ISteamAppDetails | null> {
    const response = await fetch(
      `${STORE_DETAILS_URL}?appids=${appId}&l=english&cc=us`,
      { signal: AbortSignal.timeout(STEAM_ACHIEVEMENTS_TIMEOUT_MS) }
    );

    if (!response.ok) {
      throw new Error(`Steam store answered ${response.status}`);
    }

    const body = (await response.json()) as Record<
      string,
      { success?: boolean; data?: ISteamAppDetails }
    >;
    const entry = body[String(appId)];

    return entry?.success && entry.data ? entry.data : null;
  }

  private async findImage(appId: number, file: string) {
    const url = `${STEAM_ASSETS_URL}/${appId}/${file}`;

    try {
      const response = await fetch(url, {
        method: "HEAD",
        signal: AbortSignal.timeout(STEAM_ACHIEVEMENTS_TIMEOUT_MS),
      });

      return response.ok ? url : null;
    } catch {
      return null;
    }
  }

  async createGame(app: TSteamApp) {
    const existing = await this.games
      .findOne({ "steam.appId": app.appid })
      .select("_id")
      .lean();

    if (existing) return existing;

    const details = await this.fetchDetails(app.appid);

    if (!details?.name) {
      throw new Error(`Steam has no store page for app ${app.appid}`);
    }

    const platforms = await this.platforms
      .find({ slug: { $in: Object.values(STEAM_PLATFORM_SLUGS) } })
      .select("_id slug")
      .lean();
    const cover =
      (await this.findImage(app.appid, "library_600x900_2x.jpg")) ??
      (await this.findImage(app.appid, "library_600x900.jpg")) ??
      details.header_image ??
      null;
    const hero = await this.findImage(app.appid, "library_hero.jpg");
    const slug = await uniqueSlug(
      (candidate) => this.games.exists({ slug: candidate }),
      details.name
    );
    const game = await this.gamesService.addGame(
      buildSteamGamePayload(app.appid, details, {
        slug,
        platformIdBySlug: new Map(
          platforms.map(({ _id, slug: platformSlug }) => [
            platformSlug,
            String(_id),
          ])
        ),
        cover,
        hero,
      }),
      true
    );

    this.logger.info(`Added "${game.name}" from Steam app ${app.appid}`);

    return game;
  }

  private async applyConflictDecisions(
    decisions: IConflictDecision[]
  ): Promise<Map<string, mongoose.Types.ObjectId | null>> {
    const applied = new Map<string, mongoose.Types.ObjectId | null>();

    for (const { externalId, externalData, decision, winners } of decisions) {
      const app = this.fromSnapshot(externalId, externalData);

      if (!app) continue;

      if (decision === "skip") {
        try {
          const game = await this.createGame(app);

          if (game) applied.set(externalId, game._id);
        } catch (err) {
          this.logger.warn(
            `Failed to add Steam app ${externalId} as a game: ${(err as Error).message}`
          );
        }
        continue;
      }

      if (!winners.length) continue;

      const games: TCatalogueGame[] = await this.games
        .find({ _id: { $in: winners } })
        .select("_id name slug externalPages steam")
        .lean();

      if (!games.length) continue;

      await this.games.bulkWrite(
        games.map((game) => this.linkUpdate(game, app))
      );
      applied.set(externalId, winners[0]);
    }

    return applied;
  }
}
