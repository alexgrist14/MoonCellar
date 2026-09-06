import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import { HowLongToBeatEntry, HowLongToBeatService } from "howlongtobeat-ts";
import mongoose, { FilterQuery, Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import { sleep } from "src/shared/utils";
import { runInCronLogContext } from "src/shared/cron-logging";
import { runCronExclusive } from "src/shared/cron-mutex";
import { BusinessMetricsService } from "src/module/metrics/business-metrics.service";
import { IHltbField } from "src/shared/zod/schemas/games.schema";
import { Game, GameDocument } from "../schemas/game.schema";
import { Platform, PlatformDocument } from "../schemas/platform.schema";
import {
  HLTB_CRON_DELAY_MS,
  HLTB_CRON_MAX_GAMES,
  HLTB_DEFAULT_BATCH_SIZE,
  HLTB_DEFAULT_DELAY_MS,
  HLTB_QUERY_DELAY_MS,
  HLTB_STALE_DAYS,
  HLTB_SYNC_CRON,
  HLTB_SYNC_CRON_OPTIONS,
} from "../constants/hltb";
import {
  buildHltbSearchQueries,
  buildIncrementalHltbFilter,
  buildMissingHltbFilter,
  buildPlatformKeySet,
  hasHltbTimes,
  HltbMatchContext,
  HltbSearchEntry,
  mapHltbEntryToField,
  selectHltbMatch,
} from "../utils/hltb.utils";

export type HltbSyncOptions = {
  limit?: number;
  delayMs?: number;
  onlyMissing?: boolean;
  staleDays?: number;
};

export type HltbGameTarget = {
  gameId?: string;
  slug?: string;
  hltbId?: string;
};

export type HltbGameSyncResult = {
  status: "updated" | "not_found";
  message: string;
  gameId: string;
  slug: string;
  name: string;
  hltb: IHltbField | null;
};

export type HltbSyncResult = {
  status: "running" | "finished" | "skipped" | "empty_queue";
  message: string;
  processed: number;
  updated: number;
  skipped: number;
  failed: number;
  queuedTotal?: number;
  targetTotal?: number;
  mode?: string;
};

@Injectable()
export class HltbService {
  private readonly hltbClient = new HowLongToBeatService();
  private isSyncRunning = false;

  constructor(
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<PlatformDocument>,
    private readonly logger: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {
    this.logger.setContext(HltbService.name);
  }

  @Cron(HLTB_SYNC_CRON, HLTB_SYNC_CRON_OPTIONS)
  async syncHltbCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "hltb-sync", async () => {
        try {
          return await this.metrics.trackSync("hltb-sync", () =>
            this.syncAllGames({
              limit: HLTB_CRON_MAX_GAMES,
              delayMs: HLTB_CRON_DELAY_MS,
              staleDays: HLTB_STALE_DAYS,
            })
          );
        } catch (err) {
          this.logger.error(err, "Failed to run HLTB sync cron");
          throw err;
        }
      })
    );
  }

  async syncAllGames(options?: HltbSyncOptions): Promise<HltbSyncResult> {
    if (this.isSyncRunning) {
      const message = "HLTB sync is already running, skipping new request";
      this.logger.warn(message);

      return {
        status: "skipped",
        message,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
      };
    }

    this.isSyncRunning = true;
    const startedAt = Date.now();

    try {
      return await this.runSync(options, startedAt);
    } finally {
      this.isSyncRunning = false;
    }
  }

  private async runSync(
    options: HltbSyncOptions | undefined,
    startedAt: number
  ): Promise<HltbSyncResult> {
    const maxToProcess = options?.limit;
    const delayMs = options?.delayMs ?? HLTB_DEFAULT_DELAY_MS;
    const pageSize = HLTB_DEFAULT_BATCH_SIZE;
    const filter = this.buildSyncFilter(options);
    const syncMode = this.describeSyncMode(options);
    const orderByStaleness =
      options?.staleDays != null && !options?.onlyMissing;
    const sortSpec = orderByStaleness
      ? ({ "hltb.updatedAt": 1, _id: 1 } as const)
      : ({ _id: 1 } as const);

    const queuedTotal = await this.gamesModel.countDocuments(filter);
    const targetTotal =
      maxToProcess != null ? Math.min(maxToProcess, queuedTotal) : queuedTotal;

    this.logger.info(
      `HLTB sync started (${syncMode}): queued=${queuedTotal}, target=${targetTotal}, delayMs=${delayMs}`
    );

    if (queuedTotal === 0) {
      const message =
        syncMode === "missing only"
          ? "No games without HLTB found. Try without onlyMissing=true or use staleDays=30."
          : "No games matched the sync filter";

      this.logger.info(`HLTB sync finished: ${message}`);

      return {
        status: "empty_queue",
        message,
        processed: 0,
        updated: 0,
        skipped: 0,
        failed: 0,
        queuedTotal: 0,
        targetTotal: 0,
        mode: syncMode,
      };
    }

    const platformNames = await this.loadPlatformNames();

    const result = {
      processed: 0,
      updated: 0,
      skipped: 0,
      failed: 0,
    };

    let lastId: unknown = null;
    let lastUpdatedAt: string | null = null;
    let batchNumber = 0;

    while (true) {
      if (maxToProcess != null && result.processed >= maxToProcess) {
        break;
      }

      const remaining =
        maxToProcess != null ? maxToProcess - result.processed : pageSize;
      const currentLimit = Math.min(pageSize, remaining);

      const pageFilter = this.buildPageFilter(
        filter,
        orderByStaleness,
        lastId,
        lastUpdatedAt
      );

      batchNumber += 1;
      this.logger.info(
        `HLTB sync batch #${batchNumber}: loading up to ${currentLimit} games (after ${orderByStaleness ? `updatedAt=${lastUpdatedAt ?? "never"}` : `_id=${lastId ?? "start"}`})`
      );

      const games = await this.gamesModel
        .find(pageFilter)
        .select("_id name hltb platformIds release_dates first_release")
        .sort(sortSpec)
        .limit(currentLimit)
        .lean();

      if (!games.length) {
        this.logger.info("HLTB sync: no more games in queue");
        break;
      }

      const bulkOps = [];

      for (const game of games) {
        result.processed += 1;
        const progress = `[${result.processed}/${targetTotal}]`;

        this.logger.info(`${progress} fetching HLTB for "${game.name}"`);

        try {
          const ctx = this.buildMatchContext(game, platformNames);
          const hltb = await this.fetchHltbForGame(ctx);

          if (!hltb || !hasHltbTimes(hltb)) {
            result.skipped += 1;

            const now = new Date().toISOString();
            const update: Record<string, unknown> = {
              $set: { hltbNotFoundAt: now, updatedAt: now },
            };

            if (game.hltb) {
              update.$unset = { hltb: "" };
              this.logger.warn(
                `${progress} cleared stale HLTB for "${game.name}" — no verified match`
              );
            } else {
              this.logger.warn(
                `${progress} marked "${game.name}" as not found on HLTB`
              );
            }

            bulkOps.push({
              updateOne: {
                filter: { _id: game._id },
                update,
              },
            });

            continue;
          }

          bulkOps.push({
            updateOne: {
              filter: { _id: game._id },
              update: {
                $set: {
                  hltb,
                  updatedAt: new Date().toISOString(),
                },
                $unset: { hltbNotFoundAt: "" },
              },
            },
          });

          result.updated += 1;
          this.logger.info(
            `${progress} updated "${game.name}" — main=${hltb.mainStory ?? "-"}h, main+extra=${hltb.mainExtra ?? "-"}h, completionist=${hltb.completionist ?? "-"}h`
          );
        } catch (err) {
          result.failed += 1;
          this.logger.warn(err, `${progress} failed "${game.name}"`);
        }

        if (delayMs > 0) {
          await sleep(delayMs);
        }
      }

      if (bulkOps.length) {
        await this.gamesModel.bulkWrite(bulkOps);
        this.logger.info(
          `HLTB sync batch #${batchNumber}: saved ${bulkOps.length} games to database`
        );
      }

      const lastGame = games[games.length - 1];
      lastId = lastGame._id;
      lastUpdatedAt = orderByStaleness
        ? (lastGame.hltb?.updatedAt ?? null)
        : null;

      this.logger.info(
        `HLTB sync progress: processed=${result.processed}, updated=${result.updated}, skipped=${result.skipped}, failed=${result.failed}, elapsed=${this.formatElapsed(startedAt)}`
      );

      if (games.length < currentLimit) {
        break;
      }
    }

    const message = `HLTB sync finished in ${this.formatElapsed(startedAt)}: processed=${result.processed}, updated=${result.updated}, skipped=${result.skipped}, failed=${result.failed}`;

    this.logger.info(message);

    this.metrics.recordGames("hltb", "updated", result.updated);

    return {
      status: "finished",
      message,
      ...result,
      queuedTotal,
      targetTotal,
      mode: syncMode,
    };
  }

  /** Fetches HLTB times for a single game addressed by its MoonCellar id or
   * slug. Uses the same matching rules as the bulk sync, so a manual re-parse
   * cannot store a match the cron would have rejected. */
  async syncGame(target: HltbGameTarget): Promise<HltbGameSyncResult> {
    const filter = this.buildGameFilter(target);

    const game = await this.gamesModel
      .findOne(filter)
      .select("_id slug name hltb platformIds release_dates first_release")
      .lean();

    if (!game) {
      throw new NotFoundException(
        `Game not found: ${target.gameId ?? target.slug}`
      );
    }

    if (target.hltbId) {
      return this.applyHltbEntryById(game, target.hltbId);
    }

    const platformNames = await this.loadPlatformNames();
    const ctx = this.buildMatchContext(game, platformNames);
    const hltb = await this.fetchHltbForGame(ctx);
    const now = new Date().toISOString();

    if (!hltb || !hasHltbTimes(hltb)) {
      const update: Record<string, unknown> = {
        $set: { hltbNotFoundAt: now, updatedAt: now },
      };

      if (game.hltb) {
        update.$unset = { hltb: "" };
      }

      await this.gamesModel.updateOne({ _id: game._id }, update);

      const message = game.hltb
        ? `Cleared stale HLTB for "${game.name}" — no verified match`
        : `No verified HLTB match for "${game.name}"`;

      this.logger.warn(message);

      return {
        status: "not_found",
        message,
        gameId: String(game._id),
        slug: game.slug,
        name: game.name,
        hltb: null,
      };
    }

    await this.gamesModel.updateOne(
      { _id: game._id },
      {
        $set: { hltb, updatedAt: now },
        $unset: { hltbNotFoundAt: "" },
      }
    );

    this.metrics.recordGames("hltb", "updated", 1);

    const message = `Updated "${game.name}" — main=${hltb.mainStory ?? "-"}h, main+extra=${hltb.mainExtra ?? "-"}h, completionist=${hltb.completionist ?? "-"}h`;

    this.logger.info(message);

    return {
      status: "updated",
      message,
      gameId: String(game._id),
      slug: game.slug,
      name: game.name,
      hltb,
    };
  }

  /** Stores the HLTB entry an admin picked by hand. The automatic matching
   * rules are deliberately skipped — an explicit id is a human decision — but a
   * miss must not touch the stored record, so a wrong id fails loudly instead
   * of wiping good times the way an unmatched search does. */
  private async applyHltbEntryById(
    game: Pick<
      Game,
      "name" | "slug" | "platformIds" | "release_dates" | "first_release"
    > & { _id: unknown; hltb?: IHltbField | null },
    rawHltbId: string
  ): Promise<HltbGameSyncResult> {
    const hltbId = Number(rawHltbId);

    if (!Number.isInteger(hltbId) || hltbId <= 0) {
      throw new BadRequestException(`Invalid HLTB id: ${rawHltbId}`);
    }

    const response = await this.hltbClient.getById(hltbId);

    if (!response.success || !response.data) {
      throw new NotFoundException(`HLTB entry not found: ${hltbId}`);
    }

    const hltb = mapHltbEntryToField(this.toSearchEntry(response.data));

    if (!hasHltbTimes(hltb)) {
      throw new BadRequestException(
        `HLTB entry ${hltbId} has no completion times`
      );
    }

    const now = new Date().toISOString();

    await this.gamesModel.updateOne(
      { _id: game._id },
      {
        $set: { hltb, updatedAt: now },
        $unset: { hltbNotFoundAt: "" },
      }
    );

    this.metrics.recordGames("hltb", "updated", 1);

    const message = `Linked "${game.name}" to HLTB #${hltbId} ("${hltb.sourceName}") — main=${hltb.mainStory ?? "-"}h, main+extra=${hltb.mainExtra ?? "-"}h, completionist=${hltb.completionist ?? "-"}h`;

    this.logger.info(message);

    return {
      status: "updated",
      message,
      gameId: String(game._id),
      slug: game.slug,
      name: game.name,
      hltb,
    };
  }

  private buildGameFilter(target: HltbGameTarget): FilterQuery<GameDocument> {
    if (target.gameId) {
      if (!mongoose.Types.ObjectId.isValid(target.gameId)) {
        throw new BadRequestException(`Invalid game id: ${target.gameId}`);
      }

      return { _id: new mongoose.Types.ObjectId(target.gameId) };
    }

    if (target.slug) {
      return { slug: target.slug };
    }

    throw new BadRequestException("Either gameId or slug must be provided");
  }

  private describeSyncMode(options?: HltbSyncOptions): string {
    if (options?.onlyMissing) {
      return "missing only";
    }

    if (options?.staleDays != null) {
      return `incremental (stale > ${options.staleDays} days)`;
    }

    return "full collection";
  }

  private formatElapsed(startedAt: number): string {
    const seconds = Math.round((Date.now() - startedAt) / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;

    return `${minutes}m ${restSeconds}s`;
  }

  private buildSyncFilter(
    options?: HltbSyncOptions
  ): FilterQuery<GameDocument> {
    if (options?.onlyMissing) {
      return buildMissingHltbFilter();
    }

    if (options?.staleDays != null) {
      return buildIncrementalHltbFilter(options.staleDays);
    }

    return {};
  }

  private buildPageFilter(
    filter: FilterQuery<GameDocument>,
    orderByStaleness: boolean,
    lastId: unknown,
    lastUpdatedAt: string | null
  ): FilterQuery<GameDocument> {
    if (lastId == null) {
      return filter;
    }

    if (!orderByStaleness) {
      return {
        $and: [filter, { _id: { $gt: lastId } }],
      } as FilterQuery<GameDocument>;
    }

    const cursor =
      lastUpdatedAt == null
        ? {
            $or: [
              {
                "hltb.updatedAt": { $exists: false },
                _id: { $gt: lastId },
              },
              { "hltb.updatedAt": { $exists: true } },
            ],
          }
        : {
            $or: [
              { "hltb.updatedAt": { $gt: lastUpdatedAt } },
              {
                "hltb.updatedAt": lastUpdatedAt,
                _id: { $gt: lastId },
              },
            ],
          };

    return { $and: [filter, cursor] } as FilterQuery<GameDocument>;
  }

  /** Removes the `hltb` field from every game so the catalogue can be rebuilt
   * from scratch by a subsequent sync. */
  async clearAllHltb(): Promise<{ matched: number; cleared: number }> {
    this.logger.warn("Clearing the HLTB field from all games");

    const res = await this.gamesModel.updateMany(
      {
        $or: [
          { hltb: { $exists: true } },
          { hltbNotFoundAt: { $exists: true } },
        ],
      },
      {
        $unset: { hltb: "", hltbNotFoundAt: "" },
        $set: { updatedAt: new Date().toISOString() },
      }
    );

    this.logger.info(
      `Cleared HLTB from ${res.modifiedCount} games (matched ${res.matchedCount})`
    );

    return { matched: res.matchedCount, cleared: res.modifiedCount };
  }

  private async loadPlatformNames(): Promise<Map<string, string>> {
    const platforms = await this.platformsModel
      .find({})
      .select("_id name")
      .lean();

    const map = new Map<string, string>();
    for (const platform of platforms) {
      if (platform?.name) {
        map.set(String(platform._id), platform.name);
      }
    }

    return map;
  }

  private buildMatchContext(
    game: Pick<
      Game,
      "name" | "platformIds" | "release_dates" | "first_release"
    >,
    platformNames: Map<string, string>
  ): HltbMatchContext {
    const platformLabels = (game.platformIds ?? [])
      .map((id) => platformNames.get(String(id)))
      .filter((name): name is string => !!name);

    const years = new Set<number>();
    for (const release of game.release_dates ?? []) {
      if (release?.year) {
        years.add(release.year);
      }
    }
    if (game.first_release) {
      years.add(new Date(game.first_release * 1000).getUTCFullYear());
    }

    return {
      name: game.name,
      platformKeys: buildPlatformKeySet(platformLabels),
      years,
    };
  }

  private async fetchHltbForGame(ctx: HltbMatchContext) {
    const queries = buildHltbSearchQueries(ctx.name);
    const pool = new Map<number, HltbSearchEntry>();
    let bestMatch: HltbSearchEntry | null = null;

    for (let i = 0; i < queries.length; i += 1) {
      const query = queries[i];
      this.logger.debug(
        `Searching HLTB for "${ctx.name}" with query "${query}"`
      );

      const results = await this.search(query);
      for (const entry of results) {
        if (!pool.has(entry.id)) {
          pool.set(entry.id, entry);
        }
      }

      const match = selectHltbMatch([...pool.values()], ctx);
      bestMatch = match?.entry ?? bestMatch;

      // A corroborated match (title + platform/year) is trustworthy enough to
      // stop early; the exact-title fallback waits for all queries so a later
      // query cannot reveal a second exact title that should void it.
      if (match?.tier === "confirmed") {
        return mapHltbEntryToField(match.entry);
      }

      if (i < queries.length - 1 && HLTB_QUERY_DELAY_MS > 0) {
        await sleep(HLTB_QUERY_DELAY_MS);
      }
    }

    return bestMatch ? mapHltbEntryToField(bestMatch) : null;
  }

  private async search(query: string): Promise<HltbSearchEntry[]> {
    const response = await this.hltbClient.search(query);

    if (!response.success || !response.data?.length) {
      return [];
    }

    return response.data.map((entry) => this.toSearchEntry(entry));
  }

  private toSearchEntry(entry: HowLongToBeatEntry): HltbSearchEntry {
    return {
      id: entry.id,
      name: entry.name,
      alias: entry.alias,
      type: entry.type,
      mainTime: entry.mainTime,
      mainExtraTime: entry.mainExtraTime,
      completionistTime: entry.completionistTime,
      allStylesTime: entry.allStylesTime,
      coopTime: entry.coopTime,
      multiplayerTime: entry.multiplayerTime,
      mainCount: entry.mainCount,
      mainExtraCount: entry.mainExtraCount,
      completionistCount: entry.completionistCount,
      allStylesCount: entry.allStylesCount,
      coopCount: entry.coopCount,
      multiplayerCount: entry.multiplayerCount,
      imageUrl: entry.imageUrl,
      reviewScore: entry.reviewScore,
      similarity: entry.similarity,
      platforms: entry.platforms,
      releaseYear: entry.releaseYear,
    };
  }
}
