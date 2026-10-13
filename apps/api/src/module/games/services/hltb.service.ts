import {
  BadRequestException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { InjectModel } from "@nestjs/mongoose";
import {
  type HowLongToBeatEntry,
  type HowLongToBeatResultEntry,
  HowLongToBeatService,
  type InitResponse,
  SearchModifier,
} from "howlongtobeat-ts";
import mongoose, {
  type AnyBulkWriteOperation,
  type FilterQuery,
  Model,
} from "mongoose";
import { PinoLogger } from "nestjs-pino";
import { sleep } from "../../../shared/utils";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import {
  type IConflictEntry,
  type IConflictSubject,
  type IHltbField,
} from "@mooncellar/schemas";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type {
  IConflictDecision,
  IConflictRecord,
} from "../../conflicts/types/conflicts.types";
import { Game, type GameDocument } from "../schemas/game.schema";
import { Platform, type PlatformDocument } from "../schemas/platform.schema";
import {
  HLTB_CATALOG_MIN_COMPLETENESS,
  HLTB_CATALOG_PAGE_ATTEMPTS,
  HLTB_CATALOG_PAGE_DELAY_MS,
  HLTB_CATALOG_PAGE_SIZE,
  HLTB_CATALOG_RETRY_DELAY_MS,
  HLTB_CATALOG_TOKEN_REQUESTS,
  HLTB_QUERY_DELAY_MS,
  HLTB_SYNC_CRON,
  HLTB_SYNC_CRON_OPTIONS,
  HLTB_SYNC_WRITE_BATCH,
  HLTB_USER_AGENT,
} from "../constants/hltb";
import {
  buildHltbCatalog,
  buildHltbSearchQueries,
  buildPlatformKeySet,
  findCatalogCandidates,
  findHltbConflict,
  type HltbCatalog,
  type HltbConflict,
  hasHltbTimes,
  type HltbMatchContext,
  type HltbSearchEntry,
  isSameHltb,
  mapHltbEntryToField,
  mapRawHltbEntry,
  selectHltbMatch,
} from "../utils/hltb.utils";

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

type HltbSyncTotals = {
  catalog: number;
  processed: number;
  updated: number;
  unchanged: number;
  notFound: number;
  skipped: number;
};

export type HltbSyncResult = HltbSyncTotals & {
  status: "finished" | "skipped";
  message: string;
};

type CatalogSession = { auth?: InitResponse; requests: number };

type HltbCatalogOutcome = {
  result: Exclude<keyof HltbSyncTotals, "catalog" | "processed">;
  update?: mongoose.mongo.UpdateFilter<GameDocument>;
  conflict?: HltbConflict | null;
};

const emptySyncTotals = (): HltbSyncTotals => ({
  catalog: 0,
  processed: 0,
  updated: 0,
  unchanged: 0,
  notFound: 0,
  skipped: 0,
});

const formatTotals = (totals: HltbSyncTotals) =>
  Object.entries(totals)
    .map(([key, value]) => `${key}=${value}`)
    .join(", ");

export class HltbSearchFailedError extends Error {}

@Injectable()
export class HltbService implements OnModuleInit {
  private readonly hltbClient = new HowLongToBeatService();
  private isSyncRunning = false;

  constructor(
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<PlatformDocument>,
    private readonly logger: PinoLogger,
    private readonly metrics: BusinessMetricsService,
    private readonly conflicts: ConflictsService
  ) {
    this.logger.setContext(HltbService.name);
  }

  onModuleInit() {
    this.conflicts.register({
      source: "hltb",
      direction: "entries",
      linkField: "hltb.hltbId",
      describe: (gameId) => this.describeConflict(gameId),
      apply: (decisions) => this.applyConflictDecisions(decisions),
    });
  }

  private async recordAmbiguity(
    game: { _id: unknown; name: string },
    conflict: HltbConflict | null
  ) {
    if (!conflict) return;

    await this.conflicts.refresh("hltb", [
      {
        externalId: String(game._id),
        externalName: game.name,
        reason: conflict.reason,
        candidates: [],
        entries: conflict.entries.map((entry) => this.toConflictEntry(entry)),
      },
    ]);
  }

  private toConflictEntry(entry: HltbSearchEntry): IConflictEntry {
    const field = mapHltbEntryToField(entry);
    const hours = (label: string, value: number | null) =>
      value ? [`${label} ${value} h`] : [];

    return {
      id: String(entry.id),
      name: entry.name,
      score: entry.similarity ?? null,
      releaseYear: entry.releaseYear ?? null,
      platforms: entry.platforms ?? [],
      cover: entry.imageUrl ?? null,
      url: `https://howlongtobeat.com/game/${entry.id}`,
      details: [
        ...hours("Main story", field.mainStory),
        ...hours("Main + extra", field.mainExtra),
        ...hours("Completionist", field.completionist),
        ...(entry.alias ? [`Also known as ${entry.alias}`] : []),
      ],
    };
  }

  private async describeConflict(
    gameId: string
  ): Promise<IConflictSubject | null> {
    if (!mongoose.Types.ObjectId.isValid(gameId)) return null;

    const game = await this.gamesModel
      .findById(gameId)
      .select(
        "slug name alternative_names summary first_release companies platformIds cover"
      )
      .lean();

    if (!game) return null;

    return {
      name: game.name,
      originalName: game.name,
      alternativeNames: game.alternative_names ?? [],
      description: game.summary ?? "",
      released: game.first_release
        ? new Date(game.first_release * 1000).toISOString().slice(0, 10)
        : null,
      developers: (game.companies ?? [])
        .filter(({ developer }) => developer)
        .map(({ name }) => name),
      platformIds: (game.platformIds ?? []).map(String),
      lengthMinutes: null,
      cover: game.cover ?? null,
      isExplicitCover: false,
      url: `/games/${game.slug}`,
    };
  }

  private async applyConflictDecisions(
    decisions: IConflictDecision[]
  ): Promise<Map<string, mongoose.Types.ObjectId | null>> {
    const applied = new Map<string, mongoose.Types.ObjectId | null>();

    for (const { externalId, decision, winnerEntryId } of decisions) {
      try {
        const game = await this.gamesModel
          .findById(externalId)
          .select("_id slug name hltb platformIds release_dates first_release")
          .lean();

        if (!game) continue;

        if (decision === "match" && winnerEntryId) {
          await this.applyHltbEntryById(game, winnerEntryId);
        }

        applied.set(externalId, game._id);
      } catch (err) {
        this.logger.warn(err, `Failed to apply HLTB conflict ${externalId}`);
      }
    }

    return applied;
  }

  @Cron(HLTB_SYNC_CRON, HLTB_SYNC_CRON_OPTIONS)
  async syncHltbCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "hltb-sync", async () => {
        try {
          return await this.metrics.trackSync("hltb-sync", () =>
            this.syncAllGames()
          );
        } catch (err) {
          this.logger.error(err, "Failed to run HLTB sync cron");
          throw err;
        }
      })
    );
  }

  async syncAllGames(): Promise<HltbSyncResult> {
    if (this.isSyncRunning) {
      return this.skipSync("HLTB sync is already running");
    }

    this.isSyncRunning = true;

    try {
      const lock = await withDbLock(this.gamesModel.db, "hltb-sync", () =>
        this.runSync()
      );

      return lock.locked
        ? lock.result
        : this.skipSync("HLTB sync is running in another process");
    } finally {
      this.isSyncRunning = false;
    }
  }

  private skipSync(message: string): HltbSyncResult {
    this.logger.warn(`${message}, skipping new request`);

    return { status: "skipped", message, ...emptySyncTotals() };
  }

  private async runSync(): Promise<HltbSyncResult> {
    const startedAt = Date.now();
    const catalog = buildHltbCatalog(
      await this.downloadCatalog().catch((err) => {
        this.logger.error(err, "HLTB sync aborted: no complete catalogue");
        throw err;
      })
    );
    const platformNames = await this.loadPlatformNames();
    const totals = emptySyncTotals();
    totals.catalog = catalog.entries.length;

    let ops: AnyBulkWriteOperation<GameDocument>[] = [];
    let records: IConflictRecord[] = [];
    let settled: string[] = [];

    const flush = async () => {
      if (ops.length) await this.gamesModel.bulkWrite(ops, { ordered: false });
      await this.conflicts.refresh("hltb", records);
      await this.conflicts.dismissUndecided("hltb", settled);
      ops = [];
      records = [];
      settled = [];
    };

    const games = this.gamesModel
      .find({})
      .select(
        "_id name hltb hltbNotFoundAt platformIds release_dates first_release"
      )
      .lean()
      .cursor();

    for await (const game of games) {
      totals.processed += 1;
      const outcome = this.matchFromCatalog(game, catalog, platformNames);
      totals[outcome.result] += 1;

      if (outcome.update) {
        ops.push({
          updateOne: { filter: { _id: game._id }, update: outcome.update },
        });
      }

      if (outcome.conflict) {
        records.push({
          externalId: String(game._id),
          externalName: game.name,
          reason: outcome.conflict.reason,
          candidates: [],
          entries: outcome.conflict.entries.map((entry) =>
            this.toConflictEntry(entry)
          ),
        });
      } else if (outcome.result !== "skipped") {
        settled.push(String(game._id));
      }

      if (
        Math.max(ops.length, records.length, settled.length) >=
        HLTB_SYNC_WRITE_BATCH
      ) {
        await flush();
      }

      if (totals.processed % 10000 === 0) {
        this.logger.info(`HLTB sync progress: ${formatTotals(totals)}`);
      }
    }

    await flush();

    const message = `HLTB sync finished in ${this.formatElapsed(startedAt)}: ${formatTotals(totals)}`;
    this.logger.info(message);
    this.metrics.recordGames("hltb", "updated", totals.updated);

    return { status: "finished", message, ...totals };
  }

  private matchFromCatalog(
    game: Pick<
      Game,
      | "name"
      | "platformIds"
      | "release_dates"
      | "first_release"
      | "hltbNotFoundAt"
    > & { hltb?: IHltbField | null },
    catalog: HltbCatalog,
    platformNames: Map<string, string>
  ): HltbCatalogOutcome {
    if (game.hltb?.hltbId) {
      const entry = catalog.byId.get(Number(game.hltb.hltbId));
      const hltb = entry && mapHltbEntryToField(entry);

      return hltb && hasHltbTimes(hltb)
        ? this.storeCatalogMatch(game, hltb)
        : { result: "skipped" };
    }

    const ctx = this.buildMatchContext(game, platformNames);
    const pool = findCatalogCandidates(catalog, game.name);
    const match = selectHltbMatch(pool, ctx);
    const matched = match ? mapHltbEntryToField(match.entry) : null;

    if (matched && hasHltbTimes(matched)) {
      return this.storeCatalogMatch(game, matched);
    }

    const conflict = findHltbConflict(pool, ctx);

    return game.hltbNotFoundAt
      ? { result: "notFound", conflict }
      : {
          result: "notFound",
          conflict,
          update: { $set: { hltbNotFoundAt: new Date().toISOString() } },
        };
  }

  private storeCatalogMatch(
    game: { hltb?: IHltbField | null; hltbNotFoundAt?: string },
    hltb: IHltbField
  ): HltbCatalogOutcome {
    if (game.hltb && isSameHltb(game.hltb, hltb)) {
      return game.hltbNotFoundAt
        ? { result: "unchanged", update: { $unset: { hltbNotFoundAt: "" } } }
        : { result: "unchanged" };
    }

    return {
      result: "updated",
      update: {
        $set: { hltb, updatedAt: new Date().toISOString() },
        $unset: { hltbNotFoundAt: "" },
      },
    };
  }

  private async downloadCatalog(): Promise<HltbSearchEntry[]> {
    const entries = new Map<number, HltbSearchEntry>();
    const session: CatalogSession = { requests: 0 };
    let pageTotal = 1;
    let count = 0;

    for (let page = 1; page <= pageTotal; page += 1) {
      const result = await this.fetchCatalogPageWithRetry(page, session);
      pageTotal = result.pageTotal;
      count = result.count;

      for (const raw of result.data) {
        entries.set(raw.game_id, mapRawHltbEntry(raw));
      }

      if (page % 500 === 0) {
        this.logger.info(
          `HLTB catalogue: page ${page}/${pageTotal}, ${entries.size} entries`
        );
      }

      await sleep(HLTB_CATALOG_PAGE_DELAY_MS);
    }

    if (entries.size < count * HLTB_CATALOG_MIN_COMPLETENESS) {
      throw new HltbSearchFailedError(
        `HLTB catalogue is incomplete: ${entries.size} of ${count} entries`
      );
    }

    this.logger.info(`HLTB catalogue downloaded: ${entries.size} entries`);

    return [...entries.values()];
  }

  private async fetchCatalogPageWithRetry(
    page: number,
    session: CatalogSession
  ) {
    for (let attempt = 1; ; attempt += 1) {
      try {
        if (!session.auth || session.requests >= HLTB_CATALOG_TOKEN_REQUESTS) {
          session.auth = await this.fetchSearchAuth();
          session.requests = 0;
        }

        session.requests += 1;

        return await this.fetchCatalogPage(page, session.auth);
      } catch (err) {
        const reason = (err as Error).message;

        if (attempt >= HLTB_CATALOG_PAGE_ATTEMPTS) {
          throw new HltbSearchFailedError(
            `HLTB catalogue page ${page} failed: ${reason}`
          );
        }

        session.auth = undefined;
        this.logger.warn(
          `HLTB catalogue page ${page} failed (attempt ${attempt}): ${reason}`
        );
        await sleep(HLTB_CATALOG_RETRY_DELAY_MS);
      }
    }
  }

  private async fetchCatalogPage(page: number, auth: InitResponse) {
    const body = JSON.parse(
      HowLongToBeatService.getSearchRequestData(
        "",
        SearchModifier.NONE,
        page,
        auth
      )
    );
    body.size = HLTB_CATALOG_PAGE_SIZE;
    body.searchOptions.games.sortCategory = "name";

    const response = await fetch(HowLongToBeatService.SEARCH_URL, {
      method: "POST",
      headers: HowLongToBeatService.getSearchRequestHeaders(auth),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      throw new Error(`search answered ${response.status}`);
    }

    const json = (await response.json()) as {
      count?: number;
      pageTotal?: number;
      data?: HowLongToBeatResultEntry[];
    };

    if (!Array.isArray(json.data) || !json.count || !json.pageTotal) {
      throw new Error("search answered without a catalogue page");
    }

    return { count: json.count, pageTotal: json.pageTotal, data: json.data };
  }

  private async fetchSearchAuth(): Promise<InitResponse> {
    const response = await fetch(
      `${HowLongToBeatService.INIT_URL}?t=${Date.now()}`,
      {
        headers: {
          "User-Agent": HLTB_USER_AGENT,
          Referer: HowLongToBeatService.REFERER_HEADER,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`init answered ${response.status}`);
    }

    const json = (await response.json()) as Partial<InitResponse>;

    if (!json.token) {
      throw new Error("init answered without a token");
    }

    return { ...json, userAgent: HLTB_USER_AGENT } as InitResponse;
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
      const result = await this.applyHltbEntryById(game, target.hltbId);

      await this.conflicts.removeForGame("hltb", game._id, {
        externalIds: [String(game._id)],
      });

      return result;
    }

    const platformNames = await this.loadPlatformNames();
    const ctx = this.buildMatchContext(game, platformNames);
    const { hltb, conflict, isEmpty } = await this.fetchHltbForGame(ctx);
    const now = new Date().toISOString();

    if (!hltb || !hasHltbTimes(hltb)) {
      await this.recordAmbiguity(game, conflict);

      const isKept = !!game.hltb && isEmpty;
      const update: Record<string, unknown> = {
        $set: { hltbNotFoundAt: now, updatedAt: now },
      };

      if (game.hltb) {
        update.$unset = { hltb: "" };
      }

      if (!isKept) {
        await this.gamesModel.updateOne({ _id: game._id }, update);
      }

      const message = isKept
        ? `Kept HLTB for "${game.name}" — the search returned nothing`
        : game.hltb
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

  private formatElapsed(startedAt: number): string {
    const seconds = Math.round((Date.now() - startedAt) / 1000);

    if (seconds < 60) {
      return `${seconds}s`;
    }

    const minutes = Math.floor(seconds / 60);
    const restSeconds = seconds % 60;

    return `${minutes}m ${restSeconds}s`;
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
    const hasTimes = (entry: HltbSearchEntry) =>
      hasHltbTimes(mapHltbEntryToField(entry));

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

      // A corroborated match (title + platform/year) is trustworthy enough to
      // stop early; the exact-title fallback waits for all queries so a later
      // query cannot reveal a second exact title that should void it.
      if (match?.tier === "confirmed" && hasTimes(match.entry)) {
        return {
          hltb: mapHltbEntryToField(match.entry),
          conflict: null,
          isEmpty: false,
        };
      }

      if (i < queries.length - 1 && HLTB_QUERY_DELAY_MS > 0) {
        await sleep(HLTB_QUERY_DELAY_MS);
      }
    }

    const entries = [...pool.values()];
    const match = selectHltbMatch(entries, ctx);

    return match && hasTimes(match.entry)
      ? {
          hltb: mapHltbEntryToField(match.entry),
          conflict: null,
          isEmpty: false,
        }
      : {
          hltb: null,
          conflict: findHltbConflict(entries, ctx),
          isEmpty: pool.size === 0,
        };
  }

  private async search(query: string): Promise<HltbSearchEntry[]> {
    const response = await this.hltbClient.search(query);

    if (!response.success) {
      throw new HltbSearchFailedError(
        `HLTB search failed for "${query}": ${(response as { error?: string }).error ?? "unknown error"}`
      );
    }

    if (!response.data?.length) {
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
