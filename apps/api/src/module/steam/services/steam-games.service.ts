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
import type {
  IMatchSubject,
  TMatchCandidate,
} from "../../games/matching/game-matcher.types";
import {
  MATCH_CANDIDATE_PROJECTION,
  resolveMatch,
} from "../../games/matching/game-matcher.utils";
import { IGDB_MATCH_PROFILE } from "../../games/matching/match-profiles";
import { GameMatcherService } from "../../games/matching/game-matcher.service";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type {
  IConflictDecision,
  IConflictRecord,
} from "../../conflicts/types/conflicts.types";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import { extractSteamAppInfo, mergeSteamStore } from "../utils/steam.utils";
import {
  buildSteamGamePayload,
  decodeHtml,
  parseSteamDate,
  STEAM_PLATFORM_SLUGS,
  type ISteamAppDetails,
} from "../utils/steam-game-payload.utils";
import { GamesService } from "../../games/services/games.service";
import { sleep, uniqueSlug } from "../../../shared/utils";
import {
  STEAM_GAMES_CRON,
  STEAM_GAMES_CRON_OPTIONS,
  STEAM_GAMES_PAGE_SIZE,
  STEAM_PC_PLATFORM_SLUGS,
  STEAM_STORE_DELAY_MS,
  STEAM_RELEASE_RECHECK_DAYS,
  STEAM_VERIFY_BATCH_SIZE,
  STEAM_VERIFY_LIMIT,
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
  websites?: string[];
  steam?: ISteamGameField;
};

export const getSteamUids = (
  game: Pick<TCatalogueGame, "externalPages" | "websites">
) => [
  ...new Set([
    ...(game.externalPages ?? [])
      .filter((page) => page.name === "Steam" && /^\d+$/.test(page.uid ?? ""))
      .map((page) => page.uid),
    ...(game.websites ?? []).flatMap((url) => {
      const info = extractSteamAppInfo(url);

      return info ? [String(info.gameId)] : [];
    }),
  ]),
];

export const getSteamUid = (
  game: Pick<TCatalogueGame, "externalPages" | "websites">
) => getSteamUids(game)[0];

export const pickOwnApp = <T extends { appid: number; name: string }>(
  game: Pick<TCatalogueGame, "name" | "externalPages" | "websites">,
  appById: Map<string, T>
) => {
  const apps = getSteamUids(game).flatMap((uid) => {
    const app = appById.get(uid);

    return app ? [app] : [];
  });
  const name = normalizeTitle(game.name ?? "");

  return apps.find((app) => normalizeTitle(app.name) === name) ?? apps[0];
};

export const toSteamMatchSubject = (
  app: { appid: number; name: string },
  details: ISteamAppDetails
): IMatchSubject => {
  const released = parseSteamDate(details.release_date?.date);

  return {
    id: String(app.appid),
    name: app.name,
    originalName: details.name ?? app.name,
    alternativeNames: [],
    type: details.type === "dlc" ? "DLC" : "Main Game",
    releaseDates: released
      ? [new Date(released * 1000).toISOString().slice(0, 10)]
      : [],
    developers: details.developers ?? [],
    publishers: details.publishers ?? [],
    platformSlugs: (
      Object.keys(STEAM_PLATFORM_SLUGS) as (keyof typeof STEAM_PLATFORM_SLUGS)[]
    )
      .filter((key) => details.platforms?.[key])
      .map((key) => STEAM_PLATFORM_SLUGS[key]),
    description: details.short_description
      ? decodeHtml(details.short_description)
      : "",
  };
};

export const pickSameCompanyCandidate = <
  T extends { name: string; alternative_names?: string[] | null },
>(
  appName: string,
  candidates: { game: T; breakdown: { companies: number } }[]
) => {
  const toKey = (name: string) =>
    name
      .normalize("NFKC")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim();
  const title = toKey(appName);
  const sameCompany = candidates.filter(
    ({ game, breakdown }) =>
      breakdown.companies > 0 &&
      [game.name, ...(game.alternative_names ?? [])].some(
        (name) => toKey(name) === title
      )
  );

  return sameCompany.length === 1 ? sameCompany[0].game : null;
};

export const isAutoLinkable = (
  candidates: Pick<
    TCatalogueGame,
    "externalPages" | "websites" | "platformIds"
  >[],
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
    private readonly matcher: GameMatcherService,
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
        this.metrics.trackSync("steam-games-sync", async () => {
          const result = await this.sync();

          await this.verifyConflicts();

          return result;
        })
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

  private async getPlatformIdBySlug() {
    const platforms = await this.platforms
      .find({ slug: { $in: Object.values(STEAM_PLATFORM_SLUGS) } })
      .select("_id slug")
      .lean();

    return new Map(platforms.map(({ _id, slug }) => [slug, String(_id)]));
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
      .select(
        "_id name slug nameNormalized platformIds externalPages websites steam"
      )
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
      getSteamUids(game).forEach((uid) => linkedUids.add(uid));

      const app = pickOwnApp(game, appById);

      if (app) {
        if (game.steam?.appId !== app.appid || game.steam?.name !== app.name) {
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

          if (game && !getSteamUids(game).includes(appId)) {
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
    const dismissed = await this.conflicts.dismissUndecided(
      "steam",
      [...linkedUids].filter((uid) => appById.has(uid))
    );

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
      dismissed,
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

  async verifyConflicts({
    limit = STEAM_VERIFY_LIMIT,
    isDryRun = false,
    includeVerified = false,
  }: { limit?: number; isDryRun?: boolean; includeVerified?: boolean } = {}) {
    const now = new Date();
    const pending = await this.conflicts.findUndecided("steam", {
      limit,
      unverifiedOnly: !includeVerified,
      dueBefore: now,
    });
    const platformSlugById = await this.matcher.getPlatformSlugById();
    const summary = {
      checked: 0,
      linked: 0,
      kept: 0,
      postponed: 0,
      dismissed: 0,
      failed: 0,
    };
    const examples: { game: string; app: string; rule: string }[] = [];
    let linkOps: ReturnType<SteamGamesService["linkUpdate"]>[] = [];
    let linked: string[] = [];
    let snapshots: {
      externalId: string;
      externalData: Record<string, unknown>;
    }[] = [];
    let byStatus: Record<"pending" | "postponed" | "dismissed", string[]> = {
      pending: [],
      postponed: [],
      dismissed: [],
    };
    let processed = 0;
    const flush = async () => {
      if (!isDryRun) {
        if (linkOps.length) await this.games.bulkWrite(linkOps);
        await this.conflicts.dismissUndecided("steam", linked);
        await this.conflicts.setExternalData("steam", snapshots);

        for (const status of ["pending", "postponed", "dismissed"] as const) {
          await this.conflicts.setStatus("steam", byStatus[status], status);
        }
      }

      linkOps = [];
      linked = [];
      snapshots = [];
      byStatus = { pending: [], postponed: [], dismissed: [] };
      this.logger.info(
        `Steam conflicts verify progress: ${processed}/${pending.length} ${JSON.stringify(summary)}`
      );
    };

    for (const conflict of pending) {
      const data = (conflict.externalData ?? {}) as Record<string, unknown>;
      const app = this.fromSnapshot(conflict.externalId, data);

      if (!app) continue;

      let details: ISteamAppDetails | null;

      try {
        details = await this.fetchDetails(app.appid);
      } catch (err) {
        summary.failed += 1;
        this.logger.warn(
          `Steam store details failed for app ${app.appid}: ${(err as Error).message}`
        );

        if ((err as Error).message.includes("429")) break;

        await sleep(STEAM_STORE_DELAY_MS);
        continue;
      }

      summary.checked += 1;

      const snapshot = {
        ...data,
        appId: app.appid,
        name: app.name,
        verifiedAt: now.toISOString(),
      };

      if (!details) {
        byStatus.dismissed.push(conflict.externalId);
        snapshots.push({
          externalId: conflict.externalId,
          externalData: { ...snapshot, dismissedReason: "no-store-page" },
        });
        summary.dismissed += 1;
      } else if (details.release_date?.coming_soon) {
        byStatus.postponed.push(conflict.externalId);
        snapshots.push({
          externalId: conflict.externalId,
          externalData: {
            ...snapshot,
            recheckAfter: new Date(
              now.getTime() + STEAM_RELEASE_RECHECK_DAYS * 24 * 60 * 60 * 1000
            ).toISOString(),
          },
        });
        summary.postponed += 1;
      } else {
        const games = (await this.games
          .find({
            _id: {
              $in: (conflict.candidates ?? []).map(({ gameId }) => gameId),
            },
          })
          .select({ ...MATCH_CANDIDATE_PROJECTION, externalPages: 1, steam: 1 })
          .lean()) as unknown as (TMatchCandidate & TCatalogueGame)[];
        const result = resolveMatch(
          toSteamMatchSubject(app, details),
          games,
          { platformSlugById, sharedTitles: new Set() },
          IGDB_MATCH_PROFILE
        );
        const matched = result.verdict === "matched" ? result.winner : null;
        const sameCompany =
          matched || details.type !== "game"
            ? null
            : pickSameCompanyCandidate(app.name, result.candidates);
        const winner = matched ?? sameCompany;
        const game =
          winner && games.find(({ _id }) => String(_id) === String(winner._id));

        if (game) {
          if (!isDryRun) {
            await this.fillFromStore(game._id, app, details).catch(
              (err: Error) =>
                this.logger.warn(
                  `Steam data was not copied to ${game.name}: ${err.message}`
                )
            );
          }

          linkOps.push(this.linkUpdate(game, app));
          linked.push(conflict.externalId);
          examples.push({
            game: game.name,
            app: app.name,
            rule: matched ? "matcher" : "same-company",
          });
          summary.linked += 1;
        } else {
          byStatus.pending.push(conflict.externalId);
          snapshots.push({
            externalId: conflict.externalId,
            externalData: { ...snapshot, recheckAfter: null },
          });
          summary.kept += 1;
        }
      }

      processed += 1;

      if (processed % STEAM_VERIFY_BATCH_SIZE === 0) await flush();

      await sleep(STEAM_STORE_DELAY_MS);
    }

    await flush();

    this.logger.info(
      `Steam conflicts verified${isDryRun ? " (dry run)" : ""}: ${JSON.stringify(summary)}`
    );

    return { ...summary, isDryRun, examples: examples.slice(0, 30) };
  }

  private async describeConflict(
    appId: string,
    data: Record<string, unknown> | null
  ): Promise<IConflictSubject | null> {
    const app = this.fromSnapshot(appId, data);

    if (!app) return null;

    const [details, poster] = await Promise.all([
      this.fetchDetails(app.appid).catch(() => null),
      this.findImage(app.appid, "library_600x900.jpg"),
    ]);
    const released = parseSteamDate(details?.release_date?.date);
    const platformIdBySlug = await this.getPlatformIdBySlug();
    const platformIds = details?.platforms
      ? (
          Object.keys(
            STEAM_PLATFORM_SLUGS
          ) as (keyof typeof STEAM_PLATFORM_SLUGS)[]
        )
          .filter((key) => details.platforms?.[key])
          .flatMap((key) => {
            const id = platformIdBySlug.get(STEAM_PLATFORM_SLUGS[key]);

            return id ? [id] : [];
          })
      : [...(await this.getPcPlatformIds())];

    return {
      name: app.name,
      originalName: details?.name ?? app.name,
      alternativeNames: [],
      description: details?.short_description
        ? decodeHtml(details.short_description)
        : "",
      released: released
        ? new Date(released * 1000).toISOString().slice(0, 10)
        : null,
      developers: [
        ...new Set([
          ...(details?.developers ?? []),
          ...(details?.publishers ?? []),
        ]),
      ],
      platformIds,
      lengthMinutes: null,
      cover:
        poster ??
        details?.header_image ??
        `${STEAM_ASSETS_URL}/${app.appid}/header.jpg`,
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

  async fillFromStore(
    gameId: mongoose.Types.ObjectId,
    app: TSteamApp,
    known?: ISteamAppDetails | null
  ) {
    const details = known ?? (await this.fetchDetails(app.appid));

    if (!details?.name) return [];

    const [poster, hero, platformIdBySlug] = await Promise.all([
      this.findImage(app.appid, "library_600x900_2x.jpg").then(
        async (url) =>
          url ?? (await this.findImage(app.appid, "library_600x900.jpg"))
      ),
      this.findImage(app.appid, "library_hero.jpg"),
      this.getPlatformIdBySlug(),
    ]);
    const payload = buildSteamGamePayload(app.appid, details, {
      slug: "",
      platformIdBySlug,
      cover: poster ?? details.header_image ?? null,
      hero,
    });
    const filled = await this.gamesService.fillEmptyFields(gameId, {
      cover: payload.cover,
      summary: payload.summary,
      first_release: payload.first_release,
      companies: payload.companies,
      genres: payload.genres,
      modes: payload.modes,
      platformIds: payload.platformIds,
      screenshots: payload.screenshots,
      artworks: payload.artworks,
      backgroundImage: payload.backgroundImage,
      websites: payload.websites,
    });

    if (filled.length) {
      this.logger.info(
        `Filled ${filled.join(", ")} of game ${String(gameId)} from Steam app ${app.appid}`
      );
    }

    return filled;
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

      for (const game of games) {
        await this.fillFromStore(game._id, app).catch((err: Error) =>
          this.logger.warn(
            `Steam data was not copied to ${game.name}: ${err.message}`
          )
        );
      }
    }

    return applied;
  }
}
