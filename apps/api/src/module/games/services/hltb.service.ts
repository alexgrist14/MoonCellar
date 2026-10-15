import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { findGamesWithUserData } from "../utils/game-user-data.utils";
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
import { sleep, uniqueSlug } from "../../../shared/utils";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import {
  type IConflictAiVerdict,
  type IConflictSubject,
  type IHltbField,
} from "@mooncellar/schemas";
import { isDeepStrictEqual } from "node:util";
import { pickEmptyFields } from "../utils/fill-fields.utils";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type {
  IConflictDecision,
  IConflictRecord,
} from "../../conflicts/types/conflicts.types";
import { Game, type GameDocument } from "../schemas/game.schema";
import { Platform, type PlatformDocument } from "../schemas/platform.schema";
import type { IScoredCandidate } from "../matching/game-matcher.types";
import { GamesService } from "./games.service";
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
  buildHltbGamePayload,
  buildHltbMatchContext,
  buildHltbSearchQueries,
  findCatalogCandidates,
  decideHltbMatch,
  findHltbConflict,
  getEditionParentId,
  hltbAliases,
  hltbConflictReason,
  hltbPageFields,
  readHltbPage,
  mapHltbPlatformIds,
  toHltbCandidate,
  type HltbCatalog,
  type HltbConflict,
  hasHltbTimes,
  type HltbMatchContext,
  type HltbSearchEntry,
  isOfferedLinkedEntry,
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

type THltbAppliedGame = {
  gameId: string;
  hltb: IHltbField | null;
  filled: Record<string, unknown>;
};

const HLTB_PAGE_FIELDS = [
  "summary",
  "companies",
  "first_release",
  "release_dates",
];

type THltbEntryConflict = {
  entry: HltbSearchEntry;
  candidates: IScoredCandidate[];
};

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

export class HltbSearchFailedError extends BadGatewayException {}

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
    private readonly conflicts: ConflictsService,
    private readonly gamesService: GamesService
  ) {
    this.logger.setContext(HltbService.name);
  }

  onModuleInit() {
    this.conflicts.register({
      source: "hltb",
      direction: "games",
      isMultiMatch: true,
      linkField: "hltb.hltbId",
      describe: (entryId, data) => this.describeConflict(entryId, data),
      apply: (decisions) => this.applyConflictDecisions(decisions),
      undo: (decision) => this.undoConflictDecision(decision),
      undoSkip: (decision) => this.undoSkippedConflict(decision),
    });
  }

  private collectConflict(
    byEntry: Map<number, THltbEntryConflict>,
    game: { _id: unknown; slug: string; name: string },
    conflict: HltbConflict
  ) {
    conflict.entries.forEach((entry, index) => {
      const item = byEntry.get(entry.id) ?? { entry, candidates: [] };

      item.candidates.push(toHltbCandidate(game, conflict.breakdowns[index]));
      byEntry.set(entry.id, item);
    });
  }

  private async toConflictRecords(
    byEntry: Map<number, THltbEntryConflict>
  ): Promise<IConflictRecord[]> {
    const linked = new Set<string>(
      await this.gamesModel.distinct("hltb.hltbId", {
        "hltb.hltbId": { $in: [...byEntry.keys()].map(String) },
      })
    );

    return [...byEntry.values()].flatMap(({ entry, candidates }) => {
      const offered = linked.has(String(entry.id))
        ? candidates.filter(isOfferedLinkedEntry)
        : candidates;
      const sorted = [...offered].sort((a, b) => b.score - a.score);

      return sorted.length
        ? [
            {
              externalId: String(entry.id),
              externalName: entry.name,
              externalData: { ...entry },
              reason: hltbConflictReason(sorted),
              candidates: sorted,
            },
          ]
        : [];
    });
  }

  private fromSnapshot(
    entryId: string,
    data: Record<string, unknown> | null
  ): HltbSearchEntry | null {
    return data && typeof data.name === "string"
      ? { ...(data as HltbSearchEntry), id: Number(entryId) }
      : null;
  }

  private async describeConflict(
    entryId: string,
    data: Record<string, unknown> | null
  ): Promise<IConflictSubject | null> {
    const entry = this.fromSnapshot(entryId, data);

    if (!entry) return null;

    const [platforms, linked, fetched] = await Promise.all([
      this.platformsModel.find({}).select("_id name slug").lean(),
      this.gamesModel.find({ "hltb.hltbId": entryId }).select("name").lean(),
      this.fetchEntry(entry.id).catch(() => null),
    ]);
    const page = fetched?.page;
    const field = mapHltbEntryToField(fetched?.entry ?? entry);
    const hours = (label: string, value: number | null) =>
      value ? [`${label} ${value} h`] : [];
    const facts = [
      ...hours("Main story", field.mainStory),
      ...hours("Main + extra", field.mainExtra),
      ...hours("Completionist", field.completionist),
      ...hours("Co-op", field.coop),
      ...hours("Vs.", field.multiplayer),
      ...(linked.length
        ? [`Already linked to ${linked.map(({ name }) => name).join(", ")}`]
        : []),
    ].join(" · ");

    return {
      name: entry.name,
      originalName: entry.name,
      alternativeNames: hltbAliases(entry),
      description: [page?.summary, facts].filter(Boolean).join("\n\n"),
      released:
        page?.released ??
        (entry.releaseYear ? String(entry.releaseYear) : null),
      developers: page?.developers ?? [],
      platformIds: mapHltbPlatformIds(entry.platforms ?? [], platforms),
      lengthMinutes: field.mainStory ? Math.round(field.mainStory * 60) : null,
      cover: entry.imageUrl ?? null,
      isExplicitCover: false,
      url: `https://howlongtobeat.com/game/${entry.id}`,
    };
  }

  private async fetchEntry(id: number) {
    const response = await this.hltbClient.getById(id);

    return response.success && response.data
      ? {
          entry: this.toSearchEntry(response.data),
          page: readHltbPage(
            response.data.raw as unknown as Record<string, unknown>
          ),
        }
      : null;
  }

  async createGame(
    entry: HltbSearchEntry
  ): Promise<{ _id: mongoose.Types.ObjectId; isCreated: boolean }> {
    const existing = await this.gamesModel
      .findOne({ "hltb.hltbId": String(entry.id) })
      .select("_id")
      .lean();

    if (existing) {
      return { _id: existing._id as mongoose.Types.ObjectId, isCreated: false };
    }

    const fetched = await this.fetchEntry(entry.id);
    const fresh = fetched?.entry ?? entry;
    const platforms = await this.platformsModel
      .find({})
      .select("_id name slug")
      .lean();
    const slug = await uniqueSlug(
      (candidate) => this.gamesModel.exists({ slug: candidate }),
      fresh.name
    );
    const game = await this.gamesService.addGame(
      buildHltbGamePayload(fresh, {
        slug,
        platformIds: mapHltbPlatformIds(fresh.platforms ?? [], platforms),
        page: fetched?.page ?? null,
      }),
      true
    );

    this.logger.info(`Added "${game.name}" from HLTB entry ${entry.id}`);

    return { _id: game._id as mongoose.Types.ObjectId, isCreated: true };
  }

  private async applyConflictDecisions(
    decisions: IConflictDecision[]
  ): Promise<Map<string, mongoose.Types.ObjectId | null>> {
    const applied = new Map<string, mongoose.Types.ObjectId | null>();

    for (const { externalId, externalData, decision, winners } of decisions) {
      const entry = this.fromSnapshot(externalId, externalData);

      try {
        if (decision === "skip") {
          if (!entry) continue;

          const { _id, isCreated } = await this.createGame(entry);

          await this.conflicts.setExternalData("hltb", [
            {
              externalId,
              externalData: { created: isCreated ? String(_id) : null },
            },
          ]);
          applied.set(externalId, _id);
          continue;
        }

        const games = await this.gamesModel
          .find({ _id: { $in: winners } })
          .select(
            `_id slug name hltb platformIds ${HLTB_PAGE_FIELDS.join(" ")}`
          )
          .lean();

        if (!games.length) continue;

        const changes: THltbAppliedGame[] = [];

        for (const game of games) {
          await this.applyHltbEntryById(game, externalId);

          const after = await this.gamesModel
            .findById(game._id)
            .select(HLTB_PAGE_FIELDS.join(" "))
            .lean();

          changes.push({
            gameId: String(game._id),
            hltb: game.hltb ?? null,
            filled: pickEmptyFields(
              game as unknown as Record<string, unknown>,
              (after ?? {}) as Record<string, unknown>
            ),
          });
        }

        await this.conflicts.setExternalData("hltb", [
          { externalId, externalData: { applied: changes } },
        ]);
        applied.set(externalId, games[0]._id);
      } catch (err) {
        this.logger.warn(err, `Failed to apply HLTB conflict ${externalId}`);
      }
    }

    return applied;
  }

  private async undoConflictDecision({
    externalId,
    externalData,
    winners,
  }: Pick<IConflictDecision, "externalId" | "externalData" | "winners">) {
    const changes =
      (externalData?.applied as THltbAppliedGame[] | undefined) ??
      winners.map((id) => ({ gameId: String(id), hltb: null, filled: {} }));
    const now = new Date().toISOString();

    for (const { gameId, hltb, filled } of changes) {
      const game = await this.gamesModel
        .findById(gameId)
        .select(["hltb", ...Object.keys(filled)].join(" "))
        .lean();

      if (game?.hltb?.hltbId !== externalId) continue;

      const reverted = Object.keys(filled).filter((key) =>
        isDeepStrictEqual(
          (game as unknown as Record<string, unknown>)[key],
          filled[key]
        )
      );
      const unset = [...(hltb ? [] : ["hltb"]), ...reverted];

      await this.gamesModel.updateOne(
        { _id: game._id },
        {
          $set: { ...(hltb && { hltb }), updatedAt: now },
          ...(unset.length && {
            $unset: Object.fromEntries(unset.map((key) => [key, ""])),
          }),
        }
      );
      this.logger.info(
        `Unlinked ${gameId} from HLTB ${externalId}${reverted.length ? `, cleared ${reverted.join(", ")}` : ""}`
      );
    }

    const verdict = externalData?.aiVerdict as IConflictAiVerdict | undefined;

    await this.conflicts.setExternalData("hltb", [
      {
        externalId,
        externalData: {
          applied: null,
          ...(verdict && { aiVerdict: { ...verdict, undoneAt: now } }),
        },
      },
    ]);
  }

  private async undoSkippedConflict({
    externalId,
    externalData,
  }: Pick<IConflictDecision, "externalId" | "externalData">) {
    const created = externalData?.created;

    if (created === undefined) {
      throw new ConflictException(
        "This Skip was made before created games were recorded, so the game it added is unknown. Delete that game by hand if it is wrong."
      );
    }

    if (typeof created === "string") {
      const gameId = new mongoose.Types.ObjectId(created);
      const game = await this.gamesModel
        .findById(gameId)
        .select("_id name")
        .lean();

      if (game) {
        const used = await findGamesWithUserData(
          this.gamesModel.db,
          [gameId],
          1
        );

        if (used.size) {
          throw new ConflictException(
            `"${game.name}" already has playthroughs, ratings, comments or list entries, so the Skip cannot be undone`
          );
        }

        await this.gamesService.deleteGame(gameId);
        this.logger.info(
          `Deleted "${game.name}" created by the Skip of HLTB ${externalId}`
        );
      }
    }

    const verdict = externalData?.aiVerdict as IConflictAiVerdict | undefined;

    await this.conflicts.setExternalData("hltb", [
      {
        externalId,
        externalData: {
          created: null,
          ...(verdict && {
            aiVerdict: { ...verdict, undoneAt: new Date().toISOString() },
          }),
        },
      },
    ]);
  }

  @Cron(HLTB_SYNC_CRON, HLTB_SYNC_CRON_OPTIONS)
  async syncHltbCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.logger, "hltb-sync", () =>
        this.metrics.trackSync("hltb-sync", () => this.syncAllGames())
      )
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
    } catch (err) {
      this.logger.error(err, "HLTB sync failed");
      throw err;
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
    const linkedHltbIds = await this.loadLinkedHltbIds();
    const totals = emptySyncTotals();
    totals.catalog = catalog.entries.length;

    let ops: AnyBulkWriteOperation<GameDocument>[] = [];
    const byEntry = new Map<number, THltbEntryConflict>();

    const games = this.gamesModel
      .find({})
      .select(
        "_id slug name type relatedGames.version_parent hltb hltbNotFoundAt platformIds release_dates first_release"
      )
      .lean()
      .cursor();

    for await (const game of games) {
      totals.processed += 1;
      const outcome = this.matchFromCatalog(
        game,
        catalog,
        platformNames,
        linkedHltbIds
      );
      totals[outcome.result] += 1;

      if (outcome.update) {
        ops.push({
          updateOne: { filter: { _id: game._id }, update: outcome.update },
        });
      }

      if (outcome.conflict) {
        this.collectConflict(byEntry, game, outcome.conflict);
      }

      if (ops.length >= HLTB_SYNC_WRITE_BATCH) {
        await this.gamesModel.bulkWrite(ops, { ordered: false });
        ops = [];
      }

      if (totals.processed % 10000 === 0) {
        this.logger.info(`HLTB sync progress: ${formatTotals(totals)}`);
      }
    }

    if (ops.length) await this.gamesModel.bulkWrite(ops, { ordered: false });

    const records = await this.toConflictRecords(byEntry);
    const offered = new Set(records.map(({ externalId }) => externalId));

    for (let i = 0; i < records.length; i += HLTB_SYNC_WRITE_BATCH) {
      await this.conflicts.refresh(
        "hltb",
        records.slice(i, i + HLTB_SYNC_WRITE_BATCH)
      );
    }

    await this.conflicts.dismissUndecided(
      "hltb",
      (await this.conflicts.findUndecidedIds("hltb")).filter(
        (externalId) => !offered.has(externalId)
      )
    );

    const message = `HLTB sync finished in ${this.formatElapsed(startedAt)}: ${formatTotals(totals)}`;
    this.logger.info(message);
    this.metrics.recordGames("hltb", "updated", totals.updated);

    return { status: "finished", message, ...totals };
  }

  private matchFromCatalog(
    game: Pick<
      Game,
      | "name"
      | "type"
      | "relatedGames"
      | "platformIds"
      | "release_dates"
      | "first_release"
      | "hltbNotFoundAt"
    > & { hltb?: IHltbField | null },
    catalog: HltbCatalog,
    platformNames: Map<string, string>,
    linkedHltbIds: Map<string, string>
  ): HltbCatalogOutcome {
    if (game.hltb?.hltbId) {
      const entry = catalog.byId.get(Number(game.hltb.hltbId));
      const hltb = entry && mapHltbEntryToField(entry);

      return hltb && hasHltbTimes(hltb)
        ? this.storeCatalogMatch(game, hltb)
        : { result: "skipped" };
    }

    const parentHltbId = linkedHltbIds.get(getEditionParentId(game) ?? "");
    const { entry, conflict } = decideHltbMatch(
      findCatalogCandidates(catalog, game.name),
      buildHltbMatchContext(game, platformNames),
      parentHltbId ? catalog.byId.get(Number(parentHltbId)) : null
    );

    if (entry) {
      return this.storeCatalogMatch(game, mapHltbEntryToField(entry));
    }

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
      .select(
        "_id slug name type relatedGames.version_parent hltb platformIds release_dates first_release"
      )
      .lean();

    if (!game) {
      throw new NotFoundException(
        `Game not found: ${target.gameId ?? target.slug}`
      );
    }

    if (target.hltbId) {
      return this.linkHltbId(game, target.hltbId);
    }

    const platformNames = await this.loadPlatformNames();
    const ctx = buildHltbMatchContext(game, platformNames);
    const { hltb, conflict, isEmpty } = await this.fetchHltbForGame(ctx);
    const now = new Date().toISOString();

    if (!hltb || !hasHltbTimes(hltb)) {
      const parentHltbId = await this.findParentHltbId(game);

      if (parentHltbId) {
        return this.linkHltbId(game, parentHltbId);
      }

      if (conflict) {
        const byEntry = new Map<number, THltbEntryConflict>();

        this.collectConflict(byEntry, game, conflict);
        await this.conflicts.record(
          "hltb",
          await this.toConflictRecords(byEntry)
        );
      }

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

  private async linkHltbId(
    game: Parameters<HltbService["applyHltbEntryById"]>[0] & {
      _id: mongoose.Types.ObjectId;
    },
    hltbId: string
  ): Promise<HltbGameSyncResult> {
    const result = await this.applyHltbEntryById(game, hltbId);

    await this.conflicts.removeForGame("hltb", game._id, {
      externalIds: [hltbId],
    });

    return result;
  }

  private async findParentHltbId(
    game: Pick<Game, "type" | "relatedGames">
  ): Promise<string | null> {
    const parentId = getEditionParentId(game);

    if (!parentId) return null;

    const parent = await this.gamesModel
      .findById(parentId)
      .select("hltb.hltbId")
      .lean();

    return parent?.hltb?.hltbId ?? null;
  }

  private async loadLinkedHltbIds(): Promise<Map<string, string>> {
    const games = await this.gamesModel
      .find({ "hltb.hltbId": { $exists: true } })
      .select("_id hltb.hltbId")
      .lean();

    return new Map(games.map((game) => [String(game._id), game.hltb.hltbId]));
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
    const page = readHltbPage(
      response.data.raw as unknown as Record<string, unknown>
    );

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

    await this.gamesService
      .fillEmptyFields(
        game._id as mongoose.Types.ObjectId,
        hltbPageFields(page, {
          platformIds: (game.platformIds ?? []).map(String),
        })
      )
      .catch((err: Error) =>
        this.logger.warn(
          `HLTB page data was not copied to ${game.name}: ${err.message}`
        )
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
