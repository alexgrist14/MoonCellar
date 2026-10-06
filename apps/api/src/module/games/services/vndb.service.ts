import { HttpService } from "@nestjs/axios";
import { parsePartialDate, toReleaseDate } from "../../../shared/release-date";
import { pipeline, type Readable } from "node:stream";
import { createZstdDecompress } from "node:zlib";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { firstValueFrom } from "rxjs";
import { Game, type GameDocument } from "../schemas/game.schema";
import mongoose, { Model, Types } from "mongoose";
import {
  type IVndbCharacter,
  type IVndbGameResponse,
  type IVndbNovel,
  type IVndbReleaseEntry,
  type IVndbReleaseResponse,
  type IVnMatch,
  type TReleaseSignalsByVn,
  type TVndbFilter,
  type TVndbFilters,
  type IVndbImage,
} from "../interface/vndb.interface";
import { normalizeTitle } from "../utils/title-match.utils";
import { readTarEntry } from "../utils/tar.utils";
import {
  type ICompanyField,
  type IExternalPageField,
  type IReleaseDate,
  type IConflictSubject,
  type IVndbParseResponse,
  stripBbcode,
} from "@mooncellar/schemas";
import {
  MAIN_GAME_TYPE,
  SINGLE_PLAYER_MODE,
  VNDB_EXPLICIT_IMAGES_KEYWORD,
  VNDB_EXPLICIT_SEXUAL_LEVEL,
  FAN_DISC_GAME_TYPE,
  VNDB_ORIGINAL_RELATION,
  VNDB_RELATION_FIELDS,
  VNDB_SHARED_RELATION_FIELDS,
  VISUAL_NOVEL_GENRE,
  VNDB_CHARACTER_GENDERS,
  VNDB_DB_DUMP_URL,
  VNDB_DUMP_ALIASES_ENTRY,
  VNDB_DUMP_TTL_MS,
  VNDB_IGNORED_LINKS,
  VNDB_LANGUAGE_REGIONS,
  VNDB_WORLDWIDE_REGION,
  VNDB_KEYWORD_MIN_RATING,
  VNDB_STATUS_NAMES,
  VNDB_STORE_NAMES,
  VNDB_WEBSITE_LINK,
  VNDB_WIKI_LINKS,
  VNDB_MAX_RETRIES,
  VNDB_REQUEST_DELAY_MS,
  VNDB_PAGE_SIZE,
  VNDB_SYNC_CRON,
  VNDB_SYNC_CRON_OPTIONS,
  VNDB_SYNC_REFRESH_LIMIT,
  VNDB_RETRY_DELAY_MS,
  VNDB_THEME_MIN_LEVEL,
  VNDB_THEME_TAGS,
  VNDB_PLATFORM_SLUGS,
  VNDB_RELEASE_ID_CHUNK_SIZE,
  VNDB_RELEASE_PAGE_SIZE,
} from "../constants/vndb";
import { Character } from "../schemas/character.schema";
import { Platform } from "../schemas/platform.schema";
import { isSameObjectIdList, sleep } from "../../../shared/utils";
import { S3_FOLDERS, type S3Folder } from "../../../shared/s3";
import { FileService } from "../../user/services/file-upload.service";
import { Cron } from "@nestjs/schedule";
import { PinoLogger } from "nestjs-pino";
import { runInCronLogContext } from "../../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../../shared/cron-mutex";
import { BusinessMetricsService } from "../../metrics/business-metrics.service";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type { IConflictDecision } from "../../conflicts/types/conflicts.types";
import { GameMatcherService } from "../matching/game-matcher.service";
import {
  MATCH_CANDIDATE_PROJECTION,
  resolveMatch,
} from "../matching/game-matcher.utils";
import { VNDB_MATCH_PROFILE } from "../matching/match-profiles";
import type { IMatchSubject } from "../matching/game-matcher.types";

const VNDB_API_URL = "https://api.vndb.org/kana";

const languageNames = new Intl.DisplayNames(["en"], {
  type: "language",
  languageDisplay: "standard",
});

const isEmptyValue = (value: unknown) =>
  value == null || value === "" || (Array.isArray(value) && !value.length);

const toSlug = (value: string) =>
  value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

@Injectable()
export class VndbService implements OnModuleInit {
  private readonly logger = new Logger(VndbService.name);
  private isRunning = false;
  private isLinkingRelated = false;
  private isRefreshingCharacters = false;
  private spoilerAliases?: {
    loadedAt: number;
    aliases: Promise<Map<string, Set<string>> | null>;
  };
  private lastRequestAt = 0;
  private requestTurn: Promise<void> = Promise.resolve();

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<Platform>,
    @InjectModel(Character.name)
    private readonly charactersModel: Model<Character>,
    private readonly fileService: FileService,
    private readonly pino: PinoLogger,
    private readonly metrics: BusinessMetricsService,
    private readonly conflicts: ConflictsService,
    private readonly gameMatcher: GameMatcherService
  ) {}

  onModuleInit() {
    this.conflicts.register({
      source: "vndb",
      direction: "games",
      linkField: "vndb.vnId",
      describe: (vnId) => this.describeConflict(vnId),
      apply: (decisions) => this.applyConflictDecisions(decisions),
    });
  }

  async getStats() {
    const { data } = await firstValueFrom(
      this.httpService.get<{ vn: number; chars: number; releases: number }>(
        `${VNDB_API_URL}/stats`
      )
    );
    return data;
  }

  async searchVn(title: string) {
    try {
      const { data } = await firstValueFrom(
        this.httpService.post<IVndbGameResponse>(`${VNDB_API_URL}/vn`, {
          filters: ["search", "=", title],
          fields: "title,titles.title,titles.lang",
        })
      );

      const exactMatch = data.results.filter((vn) => vn.title === title);
      console.log(exactMatch);

      return data.results[0];
    } catch (error) {
      console.log(error);
      this.logger.debug(error);
    }
  }

  @Cron(VNDB_SYNC_CRON, VNDB_SYNC_CRON_OPTIONS)
  async syncCron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, "vndb-sync", () =>
        this.metrics.trackSync("vndb-sync", () => this.sync())
      )
    );
  }

  get isSyncRunning() {
    return this.isRunning;
  }

  async backFill(
    options: { fromVnId?: string; limit?: number; restart?: boolean } = {}
  ) {
    const { vn: target } = await this.getStats();
    const fromVnId = options.restart
      ? undefined
      : (options.fromVnId ?? (await this.getLastVnId()));
    const processed = fromVnId ? await this.getProcessedVnCount() : 0;

    return this.runSync("backfill", (totals) =>
      this.processNewVns("backfill", totals, {
        ...options,
        fromVnId,
        target,
        processed,
      })
    );
  }

  async sync() {
    const { vn: target } = await this.getStats();

    return this.runSync("sync", async (totals) => {
      await this.processNewVns("sync", totals, {
        fromVnId: await this.getLastVnId(),
        processed: await this.getProcessedVnCount(),
        target,
      });
      await this.refreshLinkedVns(totals);
      await this.linkVndbRelatedGames();
    });
  }

  async parseGame(
    gameId: string,
    requestedVnId?: string
  ): Promise<IVndbParseResponse> {
    if (!mongoose.isValidObjectId(gameId)) {
      throw new BadRequestException(`Invalid game id: ${gameId}`);
    }

    const game = await this.gamesModel
      .findById(gameId)
      .select("slug vndb.vnId")
      .lean();

    if (!game) throw new NotFoundException(`Game not found: ${gameId}`);

    const newVnId = requestedVnId?.trim().toLowerCase();

    if (newVnId && newVnId !== game.vndb?.vnId) {
      if (!/^v\d+$/.test(newVnId)) {
        throw new BadRequestException(
          `Invalid VNDB id: ${requestedVnId}. A VNDB id looks like v17`
        );
      }

      if (this.isRunning) {
        throw new ConflictException("A VNDB sync is running, try again later");
      }

      const owner = await this.gamesModel
        .findOne({ "vndb.vnId": newVnId, _id: { $ne: game._id } })
        .select("slug")
        .lean();

      if (owner) {
        throw new ConflictException(
          `VNDB ${newVnId} already belongs to /games/${owner.slug}`
        );
      }

      await this.gamesModel.updateOne(
        { _id: game._id },
        { $set: { "vndb.vnId": newVnId } }
      );
      await this.conflicts.removeForGame("vndb", game._id, {
        externalIds: [newVnId],
      });
    }

    const vnId = newVnId || game.vndb?.vnId;

    if (!vnId) {
      throw new BadRequestException("The game has no VNDB id to parse");
    }

    if (this.isRunning) {
      throw new ConflictException("A VNDB sync is running, try again later");
    }

    const totals = await this.runSync(`parse ${vnId}`, (totals) =>
      this.processVns("parse", [vnId], totals)
    );

    const updated = await this.gamesModel
      .findOne({ "vndb.vnId": vnId })
      .select("slug")
      .lean();
    const slug = updated?.slug ?? game.slug;

    if (!totals || totals.failed) {
      return { slug, status: "failed", message: `VNDB ${vnId} failed to save` };
    }

    return totals.created || totals.updated
      ? { slug, status: "updated", message: `Updated from VNDB ${vnId}` }
      : { slug, status: "unchanged", message: `VNDB ${vnId} has no changes` };
  }

  private async runSync(
    mode: string,
    run: (totals: TVndbSyncTotals) => Promise<void>
  ) {
    if (this.isRunning) {
      this.logger.warn(`VNDB ${mode} skipped: another VNDB sync is running`);
      return;
    }

    this.isRunning = true;

    try {
      const lock = await withDbLock(this.gamesModel.db, "vndb-sync", () =>
        this.runLockedSync(mode, run)
      );

      if (!lock.locked) {
        this.logger.warn(
          `VNDB ${mode} skipped: a VNDB sync is running in another process`
        );
        return;
      }

      return lock.result;
    } finally {
      this.isRunning = false;
    }
  }

  private async runLockedSync(
    mode: string,
    run: (totals: TVndbSyncTotals) => Promise<void>
  ) {
    const startedAt = Date.now();
    const totals: TVndbSyncTotals = {
      vns: 0,
      matched: 0,
      ambiguous: 0,
      absent: 0,
      created: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
      covers: 0,
      screenshots: 0,
      characters: 0,
    };

    try {
      this.logger.log(`VNDB ${mode} started`);

      await run(totals);
      await this.linkVndbCharacters();

      this.logger.log(
        `VNDB ${mode} finished in ${Math.round((Date.now() - startedAt) / 1000)}s: ${totals.vns} VNs, ${totals.created} games created, ${totals.updated} updated, ${totals.unchanged} unchanged, ${totals.failed} failed`
      );

      return totals;
    } catch (error) {
      this.logger.error(error, `VNDB ${mode} failed after ${totals.vns} VNs`);
      throw error;
    }
  }

  private async processNewVns(
    mode: string,
    totals: TVndbSyncTotals,
    {
      fromVnId,
      limit,
      target,
      processed = 0,
    }: {
      fromVnId?: string;
      limit?: number;
      target?: number;
      processed?: number;
    }
  ) {
    let cursor = fromVnId;

    this.logger.log(
      `VNDB ${mode} starts after ${cursor ?? "the first VN in VNDB"}`
    );

    while (!limit || totals.vns < limit) {
      const { results, more } = await this.post<IVndbGameResponse>("/vn", {
        filters: cursor ? ["id", ">", cursor] : ["id", ">=", "v1"],
        fields: "id",
        sort: "id",
        results: limit
          ? Math.min(VNDB_PAGE_SIZE, limit - totals.vns)
          : VNDB_PAGE_SIZE,
      });

      if (!results.length) break;

      cursor = results[results.length - 1].id;
      await this.processVns(
        mode,
        results.map(({ id }) => id),
        totals,
        { target, processed }
      );

      if (!more) break;
    }
  }

  private async refreshLinkedVns(totals: TVndbSyncTotals) {
    const games = await this.gamesModel
      .find({ "vndb.vnId": { $nin: [null, ""] } })
      .sort({ "vndb.syncedAt": 1 })
      .limit(VNDB_SYNC_REFRESH_LIMIT)
      .select("vndb.vnId")
      .lean();

    for (let i = 0; i < games.length; i += VNDB_PAGE_SIZE) {
      await this.processVns(
        "sync refresh",
        games.slice(i, i + VNDB_PAGE_SIZE).map(({ vndb }) => vndb.vnId),
        totals
      );
    }
  }

  private async processVns(
    mode: string,
    vnIds: string[],
    totals: TVndbSyncTotals,
    { target, processed = 0 }: { target?: number; processed?: number } = {}
  ) {
    const matches = await this.getVnMatches(vnIds);
    const saved = await this.insertVndbGame(matches);

    await this.gamesModel.updateMany(
      { "vndb.vnId": { $in: vnIds } },
      { $set: { "vndb.syncedAt": new Date().toISOString() } }
    );

    totals.vns += vnIds.length;
    totals.characters += new Set(
      matches.flatMap(({ vndb }) => vndb.characters)
    ).size;
    matches.forEach(({ verdict }) => totals[verdict]++);
    (Object.keys(saved) as (keyof typeof saved)[]).forEach(
      (key) => (totals[key] += saved[key])
    );

    this.logger.log(
      `VNDB ${mode} progress: up to ${vnIds[vnIds.length - 1]}, ${processed + totals.vns}${target ? `/${target}` : ""} VNs | matched ${totals.matched}, ambiguous ${totals.ambiguous}, absent ${totals.absent} | games created ${totals.created}, updated ${totals.updated}, unchanged ${totals.unchanged}, failed ${totals.failed} | uploaded ${totals.covers} covers, ${totals.screenshots} screenshots | ${totals.characters} characters`
    );
  }

  private async getProcessedVnCount() {
    const [games, candidates] = await Promise.all([
      this.gamesModel.countDocuments({ "vndb.vnId": { $exists: true } }),
      this.conflicts.count("vndb"),
    ]);

    return games + candidates;
  }

  private async getLastVnId() {
    const maxVnId = (field: string) => [
      { $match: { [field]: { $regex: /^v\d+$/ } } },
      {
        $group: {
          _id: null,
          max: { $max: { $toInt: { $substrCP: [`$${field}`, 1, 10] } } },
        },
      },
    ];

    const [[games], conflictMax] = await Promise.all([
      this.gamesModel.aggregate<{ max: number }>(maxVnId("vndb.vnId")),
      this.conflicts.getMaxExternalNumber("vndb", "v"),
    ]);
    const max = Math.max(games?.max ?? 0, conflictMax);

    return max ? `v${max}` : undefined;
  }

  private async insertVndbGame(matches: IVnMatch[]) {
    const stats = {
      created: 0,
      updated: 0,
      unchanged: 0,
      failed: 0,
      covers: 0,
      screenshots: 0,
    };
    const targets = matches.filter(({ verdict }) => verdict !== "ambiguous");
    if (!targets.length) return stats;

    const existingGames = await this.gamesModel
      .find({
        $or: [
          {
            _id: {
              $in: targets
                .filter(({ winner }) => winner)
                .map(({ winner }) => winner._id),
            },
          },
          { "vndb.vnId": { $in: targets.map(({ vnId }) => vnId) } },
        ],
      })
      .select(
        "_id name nameNormalized type summary alternative_names genres keywords themes companies websites externalPages first_release release_dates platformIds status languages cover screenshots isStopParsingPictures vndb"
      )
      .lean();

    const gameById = new Map(
      existingGames.map((game) => [String(game._id), game])
    );
    const gameByVnId = new Map(
      existingGames
        .filter(({ vndb }) => vndb?.vnId)
        .map((game) => [game.vndb.vnId, game])
    );

    const now = new Date().toISOString();
    const reservedSlugs = new Set<string>();
    const ops = [];

    for (const { vndb: vn, vnId, winner } of targets) {
      const existingGame = winner
        ? gameById.get(String(winner._id))
        : gameByVnId.get(vnId);
      const gameId = existingGame?._id ?? new Types.ObjectId();
      const { uploadedScreenshots, ...images } = await this.uploadVndbImages(
        gameId,
        vn,
        existingGame
      );

      if (images.cover) stats.covers++;
      stats.screenshots += uploadedScreenshots;

      const fields = Object.fromEntries(
        Object.entries({
          name: vn.name,
          nameNormalized: normalizeTitle(vn.name),
          type: vn.type,
          summary: stripBbcode(vn.description),
          alternative_names: [
            ...new Set([
              ...vn.alternativeNames,
              ...(existingGame?.alternative_names ?? []),
              existingGame?.name,
            ]),
          ].filter((alias) => alias && alias !== vn.name),
          genres: [
            ...new Set([...(existingGame?.genres ?? []), VISUAL_NOVEL_GENRE]),
          ],
          keywords: vn.keywords,
          themes: vn.themes,
          companies: vn.companies,
          websites: [
            ...new Set([...(existingGame?.websites ?? []), ...vn.websites]),
          ],
          externalPages: [
            ...vn.externalPages,
            ...(existingGame?.externalPages ?? []).filter(
              (page) => !vn.externalPages.some(({ name }) => name === page.name)
            ),
          ],
          first_release: vn.first_release,
          release_dates: vn.release_dates,
          platformIds: vn.platformIds,
          status: vn.status,
          languages: vn.languages,
          ...images,
          vndb: {
            vnId,
            lengthMinutes: vn.length,
            relations: vn.relations,
            rating: vn.rating,
            votecount: vn.votecount,
            syncedAt: existingGame?.vndb?.syncedAt,
          },
        }).filter(([, value]) => !isEmptyValue(value))
      );

      if (existingGame) {
        const changedFields = Object.fromEntries(
          Object.entries(fields).filter(
            ([field, value]) =>
              JSON.stringify(value) !==
              JSON.stringify((existingGame as Record<string, unknown>)[field])
          )
        );

        if (!Object.keys(changedFields).length) {
          stats.unchanged++;
          continue;
        }

        stats.updated++;
        ops.push({
          updateOne: {
            filter: { _id: gameId },
            update: { $set: { ...changedFields, updatedAt: now } },
          },
        });
        continue;
      }

      stats.created++;
      ops.push({
        insertOne: {
          document: {
            _id: gameId,
            ...fields,
            updatedAt: now,
            slug: await this.resolveUniqueSlug(vn.name, vnId, reservedSlugs),
            modes: [SINGLE_PLAYER_MODE],
            isCustom: false,
            createdAt: now,
          },
        },
      });
    }

    if (!ops.length) return stats;

    try {
      await this.gamesModel.bulkWrite(ops, { ordered: false });
    } catch (error) {
      stats.failed =
        (error as { writeErrors?: unknown[] }).writeErrors?.length ??
        ops.length;
      this.logger.error(
        error,
        `Failed to save ${stats.failed}/${ops.length} VNDB games`
      );
      return stats;
    }

    return stats;
  }

  private async uploadVndbImages(
    gameId: Types.ObjectId,
    vn: IVndbTitles,
    game?: Pick<Game, "cover" | "screenshots" | "isStopParsingPictures">
  ): Promise<{
    cover?: string;
    screenshots?: string[];
    uploadedScreenshots: number;
  }> {
    if (game?.isStopParsingPictures) return { uploadedScreenshots: 0 };

    const isStored = (folder: S3Folder, url: string, imageId: string) =>
      this.isStoredVndbImage(folder, url, `${gameId}/${imageId}`);

    const images: {
      cover?: string;
      screenshots?: string[];
    } = {};

    if (vn.cover && !isStored(S3_FOLDERS.covers, game?.cover, vn.cover.id)) {
      const cover = await this.uploadVndbImage(
        S3_FOLDERS.covers,
        gameId,
        vn.cover
      );

      if (cover) {
        images.cover = cover;
      }
    }

    const storedScreenshots = game?.screenshots ?? [];
    const vndbScreenshots: string[] = [];
    let uploadedScreenshots = 0;

    for (const screenshot of vn.screenshots ?? []) {
      const storedUrl = storedScreenshots.find((url) =>
        isStored(S3_FOLDERS.screenshots, url, screenshot.id)
      );
      const url =
        storedUrl ??
        (await this.uploadVndbImage(
          S3_FOLDERS.screenshots,
          gameId,
          screenshot
        ));

      if (!url) continue;
      if (!storedUrl) uploadedScreenshots++;

      vndbScreenshots.push(url);
    }

    images.screenshots = [
      ...vndbScreenshots,
      ...storedScreenshots.filter((url) => !vndbScreenshots.includes(url)),
    ];

    return { ...images, uploadedScreenshots };
  }

  private isStoredVndbImage(
    folder: S3Folder,
    url: string | null | undefined,
    key: string
  ) {
    return (
      this.fileService.getKeyFromUrl(folder, url)?.replace(/\.[^./]+$/, "") ===
      key
    );
  }

  private async uploadVndbImage(
    folder: S3Folder,
    keyPrefix: Types.ObjectId | string,
    image: Pick<IVndbImage, "id" | "url">
  ) {
    try {
      const { data, headers } =
        await this.httpService.axiosRef.get<ArrayBuffer>(image.url, {
          responseType: "arraybuffer",
        });
      const storedKey = await this.fileService.uploadFile(
        {
          buffer: Buffer.from(data),
          mimetype: String(headers["content-type"]).split(";")[0],
        } as Express.Multer.File,
        `${keyPrefix}/${image.id}`,
        folder
      );

      return storedKey
        ? this.fileService.getPublicUrl(folder, storedKey)
        : null;
    } catch (error) {
      this.logger.error(error, `Failed to upload VNDB image: ${image.url}`);
      return null;
    }
  }

  private async resolveUniqueSlug(
    name: string,
    vnId: string,
    reservedSlugs: Set<string>
  ) {
    const baseSlug = toSlug(name) || vnId;
    let slug = baseSlug;

    for (
      let suffix = 2;
      reservedSlugs.has(slug) || (await this.gamesModel.exists({ slug }));
      suffix++
    ) {
      slug = `${baseSlug}-${suffix}`;
    }

    reservedSlugs.add(slug);

    return slug;
  }

  private async getVndbPlatformId(vndbPlatform: string) {
    const [slug] = VNDB_PLATFORM_SLUGS[vndbPlatform] ?? [];
    if (!slug) return null;

    const platform = await this.platformsModel
      .findOne({ slug }, { _id: 1 })
      .lean<{ _id: Types.ObjectId }>();

    return platform?._id ?? null;
  }

  private async getVndbTitles(vnIds: string[]) {
    const searchIdsFilters: TVndbFilter[] = vnIds.map((id) => ["id", "=", id]);

    const novelsResponse = await this.post<IVndbGameResponse>("/vn", {
      filters: ["or", ...searchIdsFilters] satisfies TVndbFilters,
      results: vnIds.length,
      fields:
        "title,alttitle,titles.title,titles.lang,titles.latin,titles.official,titles.main,released,platforms,rating,votecount,description,developers.name,developers.original,developers.aliases,extlinks.url,extlinks.name,image.url,image.dims,image.sexual,image.violence,screenshots.url,screenshots.dims,screenshots.sexual,screenshots.violence,length_minutes,languages,devstatus,tags.id,tags.name,tags.rating,tags.spoiler,tags.lie,tags.category,relations.id,relations.relation,relations.relation_official,image.id,screenshots.id",
    });

    const themesByVn = await this.getThemes(vnIds);
    const characters = await this.getCharacters([
      "vn",
      "=",
      ["or", ...searchIdsFilters],
    ]);
    await this.saveCharacters(characters);

    const [signalsByVn, platformSlugById] = await Promise.all([
      this.fetchReleaseSignals(vnIds),
      this.getPlatformSlugs(),
    ]);

    const platformIdBySlug = new Map(
      [...platformSlugById].map(([id, slug]) => [slug, new Types.ObjectId(id)])
    );

    const titles = novelsResponse.results.map((novel) => {
      const vn = this.getTitles(
        novel,
        themesByVn.get(novel.id) ?? [],
        characters
      );
      const signals = signalsByVn.get(vn.id);

      return {
        ...vn,
        publishers: signals?.publishers ?? [],
        releaseDates: [
          ...new Set([...vn.releaseDates, ...(signals?.releaseDates ?? [])]),
        ],
        platforms: [
          ...new Set([...vn.platforms, ...(signals?.platforms ?? [])]),
        ],
        platformIds: this.getPlatformIds(
          [...vn.platforms, ...(signals?.platforms ?? [])],
          platformIdBySlug
        ),
        companies: this.getCompanies(
          vn.companies,
          signals?.publisherNames ?? []
        ),
        websites: [...new Set([...(signals?.websites ?? []), ...vn.websites])],
        externalPages: signals?.externalPages ?? [],
        release_dates: this.getReleaseDates(
          signals?.releases ?? [],
          platformIdBySlug
        ),
      };
    });

    return { titles, platformSlugById };
  }

  private async getVnMatches(vnIds: string[]): Promise<IVnMatch[]> {
    const { titles: vndbTitles, platformSlugById } =
      await this.getVndbTitles(vnIds);
    const subjects = vndbTitles.map(toVndbMatchSubject);
    const { candidatesBySubject, sharedTitles } =
      await this.gameMatcher.findCandidates(subjects);

    const linkedGames = await this.gamesModel
      .find(
        { "vndb.vnId": { $in: vnIds } },
        { ...MATCH_CANDIDATE_PROJECTION, "vndb.vnId": 1 }
      )
      .lean();
    const linkedGameByVnId = new Map(
      linkedGames.map((game) => [game.vndb.vnId, game])
    );

    const matches = vndbTitles
      .map((vn, index): IVnMatch => ({
        vnId: vn.id,
        vnName: vn.name,
        vndb: { ...vn },
        ...resolveMatch(
          subjects[index],
          candidatesBySubject.get(vn.id) ?? [],
          { platformSlugById, sharedTitles },
          VNDB_MATCH_PROFILE
        ),
      }))
      .map((match) => {
        const linkedGame = linkedGameByVnId.get(match.vnId);

        return linkedGame
          ? {
              ...match,
              verdict: "matched" as const,
              reason: null,
              winner: linkedGame,
            }
          : match;
      });
    await this.conflicts.record(
      "vndb",
      matches
        .filter(({ verdict }) => verdict === "ambiguous")
        .map(({ vnId, vnName, reason, candidates }) => ({
          externalId: vnId,
          externalName: vnName,
          reason,
          candidates,
        }))
    );

    return matches;
  }

  async describeConflict(vnId: string): Promise<IConflictSubject | null> {
    const [{ results }, platformSlugById] = await Promise.all([
      this.post<IVndbGameResponse>("/vn", {
        filters: ["id", "=", vnId] satisfies TVndbFilter,
        fields:
          "title,alttitle,titles.title,titles.lang,titles.latin,titles.official,titles.main,released,platforms,description,developers.name,image.url,image.sexual,length_minutes,rating,votecount",
      }),
      this.getPlatformSlugs(),
    ]);

    const platformIdBySlug = new Map(
      [...platformSlugById].map(([id, slug]) => [slug, new Types.ObjectId(id)])
    );
    const vn = results[0] ? this.getTitles(results[0], [], []) : null;

    if (!vn) return null;

    return {
      name: vn.name,
      originalName: vn.originalName,
      alternativeNames: vn.alternativeNames,
      description: stripBbcode(vn.description),
      released: vn.released ?? null,
      developers: vn.companies.map(({ name }) => name),
      platformIds: this.getPlatformIds(vn.platforms, platformIdBySlug).map(
        String
      ),
      lengthMinutes: vn.length ?? null,
      cover: vn.cover?.url ?? null,
      isExplicitCover: (vn.cover?.sexual ?? 0) > VNDB_EXPLICIT_SEXUAL_LEVEL,
      url: `https://vndb.org/${vnId}`,
    };
  }

  private async applyConflictDecisions(
    decisions: IConflictDecision[]
  ): Promise<Map<string, Types.ObjectId>> {
    const [{ titles }, winners] = await Promise.all([
      this.getVndbTitles(decisions.map(({ externalId }) => externalId)),
      this.gamesModel
        .find(
          {
            _id: {
              $in: decisions.flatMap(({ winner }) => (winner ? [winner] : [])),
            },
          },
          MATCH_CANDIDATE_PROJECTION
        )
        .lean(),
    ]);

    const titleByVnId = new Map(titles.map((vn) => [vn.id, vn]));
    const winnerById = new Map(winners.map((game) => [String(game._id), game]));

    const matches = decisions.flatMap(
      ({ externalId, externalName, decision, winner }): IVnMatch[] => {
        const vndb = titleByVnId.get(externalId);
        const game = winner ? winnerById.get(String(winner)) : undefined;

        if (!vndb || (decision === "match" && !game)) return [];

        return [
          {
            vnId: externalId,
            vnName: externalName,
            verdict: game ? "matched" : "absent",
            reason: null,
            winner: game ?? null,
            vndb,
            candidates: [],
          },
        ];
      }
    );

    await this.insertVndbGame(matches);

    const vnIds = matches.map(({ vnId }) => vnId);
    const linkedGames = await this.gamesModel
      .find({ "vndb.vnId": { $in: vnIds } })
      .select("_id vndb.vnId")
      .lean();

    await this.gamesModel.updateMany(
      { "vndb.vnId": { $in: vnIds } },
      { $set: { "vndb.syncedAt": new Date().toISOString() } }
    );

    if (linkedGames.length) await this.linkVndbCharacters();

    return new Map(linkedGames.map((game) => [game.vndb.vnId, game._id]));
  }

  get isLinkingRelatedGames() {
    return this.isLinkingRelated;
  }

  async linkVndbRelatedGames() {
    if (this.isLinkingRelated) {
      this.logger.warn("VNDB related games linking is already running");
      return;
    }

    this.isLinkingRelated = true;

    try {
      return await this.runRelatedGamesLinking();
    } catch (error) {
      this.logger.error(error, "VNDB related games linking failed");
      throw error;
    } finally {
      this.isLinkingRelated = false;
    }
  }

  private async runRelatedGamesLinking() {
    const games = await this.gamesModel
      .find({ "vndb.vnId": { $exists: true } })
      .select("_id relatedGames vndb.vnId vndb.relations")
      .lean();

    const gameIdByVnId = new Map(
      games.map((game) => [game.vndb.vnId, game._id])
    );
    const now = new Date().toISOString();
    const ops = [];

    for (const game of games) {
      const linked: Record<string, Types.ObjectId[]> = Object.fromEntries(
        Object.values(VNDB_RELATION_FIELDS).map((field) => [field, []])
      );
      let parentGame: Types.ObjectId | undefined;

      for (const { vnId, relation } of game.vndb.relations ?? []) {
        const relatedId = gameIdByVnId.get(vnId);
        if (!relatedId) continue;

        if (relation === VNDB_ORIGINAL_RELATION) {
          parentGame ??= relatedId;
        } else if (VNDB_RELATION_FIELDS[relation]) {
          linked[VNDB_RELATION_FIELDS[relation]].push(relatedId);
        }
      }

      const relatedGames = {
        ...game.relatedGames,
        ...Object.fromEntries(
          Object.entries(linked).filter(
            ([field, ids]) =>
              ids.length || !VNDB_SHARED_RELATION_FIELDS.includes(field)
          )
        ),
        ...(parentGame && { parent_game: parentGame }),
      };

      if (
        JSON.stringify(relatedGames) === JSON.stringify(game.relatedGames ?? {})
      ) {
        continue;
      }

      ops.push({
        updateOne: {
          filter: { _id: game._id },
          update: { $set: { relatedGames, updatedAt: now } },
        },
      });
    }

    if (ops.length) {
      await this.gamesModel.bulkWrite(ops);
    }

    this.logger.log(
      `Linked VNDB related games: ${ops.length}/${games.length} games updated`
    );

    return { gamesMatched: games.length, gamesUpdated: ops.length };
  }

  async linkVndbCharacters() {
    const [characters, games] = await Promise.all([
      this.charactersModel
        .find({ "vndb.characterId": { $exists: true } })
        .select("_id gameIds spoilerGameIds vndb.vns vndb.spoilerVns")
        .lean(),
      this.gamesModel
        .find({ "vndb.vnId": { $exists: true } })
        .select("_id characters vndb.vnId")
        .lean(),
    ]);

    const gameIdByVnId = new Map(
      games.map((game) => [game.vndb.vnId, game._id])
    );
    const characterIdsByVnId = new Map<string, Types.ObjectId[]>();
    const now = new Date().toISOString();
    const characterOps = [];

    const toGameIds = (vnIds: string[] = []) =>
      vnIds
        .map((vnId) => gameIdByVnId.get(vnId))
        .filter((id): id is Types.ObjectId => !!id);

    for (const character of characters) {
      const gameIds = toGameIds(character.vndb.vns);
      const spoilerGameIds = toGameIds(character.vndb.spoilerVns);

      for (const vnId of character.vndb.vns) {
        const bucket = characterIdsByVnId.get(vnId);

        if (bucket) {
          bucket.push(character._id);
        } else {
          characterIdsByVnId.set(vnId, [character._id]);
        }
      }

      if (
        !isSameObjectIdList(character.gameIds, gameIds) ||
        !isSameObjectIdList(character.spoilerGameIds, spoilerGameIds)
      ) {
        characterOps.push({
          updateOne: {
            filter: { _id: character._id },
            update: { $set: { gameIds, spoilerGameIds, updatedAt: now } },
          },
        });
      }
    }

    const gameOps = [];

    for (const game of games) {
      const gameCharacters = characterIdsByVnId.get(game.vndb.vnId) ?? [];

      if (isSameObjectIdList(game.characters, gameCharacters)) continue;

      gameOps.push({
        updateOne: {
          filter: { _id: game._id },
          update: { $set: { characters: gameCharacters, updatedAt: now } },
        },
      });
    }

    if (characterOps.length) {
      await this.charactersModel.bulkWrite(characterOps);
    }

    if (gameOps.length) {
      await this.gamesModel.bulkWrite(gameOps);
    }

    this.logger.log(
      `Linked VNDB characters: ${characterOps.length} character(s), ${gameOps.length} game(s) updated`
    );

    return {
      charactersUpdated: characterOps.length,
      gamesUpdated: gameOps.length,
    };
  }

  get isRefreshingVndbCharacters() {
    return this.isRefreshingCharacters;
  }

  async refreshVndbCharacters() {
    if (this.isRefreshingCharacters) {
      this.logger.warn("VNDB characters refresh is already running");
      return;
    }

    this.isRefreshingCharacters = true;

    try {
      const characterIds = (
        await this.charactersModel
          .find({ "vndb.characterId": { $exists: true } })
          .select("vndb.characterId")
          .lean()
      ).map(({ vndb }) => vndb.characterId);
      const totals = { characters: 0, images: 0 };

      for (let i = 0; i < characterIds.length; i += VNDB_PAGE_SIZE) {
        const characters = await this.getCharacters([
          "or",
          ...characterIds
            .slice(i, i + VNDB_PAGE_SIZE)
            .map((id): TVndbFilter => ["id", "=", id]),
        ]);

        totals.images += await this.saveCharacters(characters);
        totals.characters += characters.length;

        this.logger.log(
          `VNDB characters refresh: ${Math.min(i + VNDB_PAGE_SIZE, characterIds.length)}/${characterIds.length} | refreshed ${totals.characters} | uploaded ${totals.images} images`
        );
      }

      await this.linkVndbCharacters();

      return totals;
    } catch (error) {
      this.logger.error(error, "VNDB characters refresh failed");
      throw error;
    } finally {
      this.isRefreshingCharacters = false;
    }
  }

  private async getCharacters(
    filters: TVndbFilter | TVndbFilters
  ): Promise<IVndbCharacter[]> {
    const characters: IVndbCharacter[] = [];

    for (let page = 1, more = true; more; page++) {
      const data = await this.post<{
        more: boolean;
        results: IVndbCharacter[];
      }>("/character", {
        filters,
        fields:
          "name,original,aliases,description,image.id,image.url,image.sexual,image.violence,sex,vns.id,vns.spoiler,gender,traits.name,traits.group_name,traits.spoiler,traits.lie,traits.sexual",
        results: 100,
        page,
      });

      characters.push(...data.results);
      more = data.more;
    }

    return characters;
  }

  private getSpoilerAliases() {
    if (
      !this.spoilerAliases ||
      Date.now() - this.spoilerAliases.loadedAt > VNDB_DUMP_TTL_MS
    ) {
      this.spoilerAliases = {
        loadedAt: Date.now(),
        aliases: this.fetchSpoilerAliases().catch((error) => {
          this.logger.error(error, "Failed to load VNDB spoiler aliases");
          this.spoilerAliases = undefined;
          return null;
        }),
      };
    }

    return this.spoilerAliases.aliases;
  }

  private async fetchSpoilerAliases() {
    const { data } = await this.httpService.axiosRef.get<Readable>(
      VNDB_DB_DUMP_URL,
      { responseType: "stream" }
    );
    const aliases = await readTarEntry(
      pipeline(data, createZstdDecompress(), () => undefined),
      VNDB_DUMP_ALIASES_ENTRY
    );

    if (!aliases) {
      throw new Error(`${VNDB_DUMP_ALIASES_ENTRY} is missing in the VNDB dump`);
    }

    const spoilerAliases = new Map<string, Set<string>>();

    for (const line of aliases.toString("utf8").split("\n")) {
      const [id, spoil, name, latin] = line.split("\t");

      if (!(Number(spoil) > 0)) continue;

      const names = spoilerAliases.get(id) ?? new Set<string>();

      spoilerAliases.set(id, names.add(name));
      if (latin !== "\\N") names.add(latin);
    }

    this.logger.log(
      `Loaded VNDB spoiler aliases for ${spoilerAliases.size} characters`
    );

    return spoilerAliases;
  }

  private async saveCharacters(characters: IVndbCharacter[]) {
    if (!characters.length) return 0;

    const now = new Date().toISOString();
    const spoilerAliases = await this.getSpoilerAliases();

    await this.charactersModel.bulkWrite(
      characters.map((character) => ({
        updateOne: {
          filter: { "vndb.characterId": character.id },
          update: {
            $set: {
              name: character.name,
              slug: [toSlug(character.name), character.id]
                .filter(Boolean)
                .join("-"),
              ...(spoilerAliases &&
                this.splitAkas(character, spoilerAliases.get(character.id))),
              description: character.description,
              gender: VNDB_CHARACTER_GENDERS[character.sex?.[0] ?? ""] ?? null,
              isExplicitImage:
                (character.image?.sexual ?? 0) > VNDB_EXPLICIT_SEXUAL_LEVEL,
              traits: (character.traits ?? [])
                .filter(({ lie, sexual }) => !lie && !sexual)
                .map(({ name, group_name, spoiler }) => ({
                  group: group_name,
                  name,
                  isSpoiler: spoiler > 0,
                })),
              vndb: {
                characterId: character.id,
                vns: character.vns.map(({ id }) => id),
                spoilerVns: character.vns
                  .filter(({ spoiler }) => spoiler > 0)
                  .map(({ id }) => id),
                image: character.image?.url ?? null,
              },
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          upsert: true,
        },
      })),
      { ordered: false }
    );

    return this.uploadCharacterImages(characters);
  }

  private splitAkas(
    { original, aliases }: IVndbCharacter,
    spoilers = new Set<string>()
  ) {
    const akas = [
      ...new Set(
        [original, ...(aliases ?? [])].filter((aka): aka is string => !!aka)
      ),
    ];

    return {
      akas: akas.filter((aka) => !spoilers.has(aka)),
      spoilerAkas: akas.filter((aka) => spoilers.has(aka)),
    };
  }

  private async uploadCharacterImages(characters: IVndbCharacter[]) {
    const stored = await this.charactersModel
      .find({ "vndb.characterId": { $in: characters.map(({ id }) => id) } })
      .select("mugShot vndb.characterId")
      .lean();
    const mugShotById = new Map(
      stored.map(({ mugShot, vndb }) => [vndb.characterId, mugShot])
    );
    let uploaded = 0;

    for (const { id, image } of characters) {
      if (
        !image ||
        this.isStoredVndbImage(
          S3_FOLDERS.characters,
          mugShotById.get(id),
          `${id}/${image.id}`
        )
      ) {
        continue;
      }

      const mugShot = await this.uploadVndbImage(
        S3_FOLDERS.characters,
        id,
        image
      );

      if (!mugShot) continue;

      await this.charactersModel.updateOne(
        { "vndb.characterId": id },
        { $set: { mugShot } }
      );
      uploaded++;
    }

    return uploaded;
  }

  private async getThemes(vnIds: string[]): Promise<Map<string, string[]>> {
    const themesByVn = new Map<string, string[]>();
    const idFilters: TVndbFilter[] = vnIds.map((id) => ["id", "=", id]);

    for (const [tagId, theme] of Object.entries(VNDB_THEME_TAGS)) {
      const { results } = await this.post<IVndbGameResponse>("/vn", {
        filters: [
          "and",
          ["or", ...idFilters],
          ["tag", "=", [tagId, 0, VNDB_THEME_MIN_LEVEL]],
        ],
        fields: "id",
        results: 100,
      });

      for (const { id } of results) {
        themesByVn.set(id, [...(themesByVn.get(id) ?? []), theme]);
      }
    }

    return themesByVn;
  }

  private waitForRequestTurn() {
    this.requestTurn = this.requestTurn.then(async () => {
      await sleep(this.lastRequestAt + VNDB_REQUEST_DELAY_MS - Date.now());
      this.lastRequestAt = Date.now();
    });

    return this.requestTurn;
  }

  private async post<T>(path: string, body: unknown): Promise<T> {
    for (let attempt = 0; ; attempt++) {
      await this.waitForRequestTurn();

      try {
        const { data } = await firstValueFrom(
          this.httpService.post<T>(`${VNDB_API_URL}${path}`, body)
        );

        return data;
      } catch (error) {
        const { response, code } = error as {
          response?: { status?: number };
          code?: string;
        };

        if (
          (response && response.status !== 429) ||
          attempt >= VNDB_MAX_RETRIES
        ) {
          throw error;
        }

        this.logger.warn(
          `VNDB request ${path} failed (${response?.status ?? code}), retry ${attempt + 1}/${VNDB_MAX_RETRIES}`
        );
        await sleep(VNDB_RETRY_DELAY_MS * (attempt + 1));
      }
    }
  }

  private getPlatformIds(
    platforms: string[],
    platformIdBySlug: Map<string, Types.ObjectId>
  ): Types.ObjectId[] {
    const ids = platforms
      .map((platform) =>
        platformIdBySlug.get(VNDB_PLATFORM_SLUGS[platform]?.[0])
      )
      .filter((id): id is Types.ObjectId => !!id);

    return [...new Map(ids.map((id) => [String(id), id])).values()];
  }

  private getCompanies(
    developers: ICompanyField[],
    publisherNames: string[]
  ): ICompanyField[] {
    return [
      ...developers.map((company) => ({
        ...company,
        publisher: publisherNames.includes(company.name),
      })),
      ...[...new Set(publisherNames)]
        .filter((name) => !developers.some((company) => company.name === name))
        .map((name) => ({
          name,
          developer: false,
          publisher: true,
          porting: false,
          supporting: false,
        })),
    ];
  }

  private getReleaseDates(
    releases: IVndbReleaseEntry[],
    platformIdBySlug: Map<string, Types.ObjectId>
  ): TVndbReleaseDate[] {
    return releases.flatMap(({ released, platform, region }) => {
      const releaseDate = toReleaseDate(released);
      const [slug] = VNDB_PLATFORM_SLUGS[platform] ?? [];
      const platformId = platformIdBySlug.get(slug);

      if (!releaseDate || !platformId) return [];

      return [{ ...releaseDate, platformId, region }];
    });
  }

  private async getPlatformSlugs(): Promise<Map<string, string>> {
    const platforms = await this.platformsModel
      .find({}, { slug: 1 })
      .lean<{ _id: mongoose.Types.ObjectId; slug: string }[]>();

    return new Map(platforms.map(({ _id, slug }) => [String(_id), slug]));
  }

  private async fetchReleaseSignals(
    vnIds: string[]
  ): Promise<TReleaseSignalsByVn> {
    const signalsByVn = new Map<
      string,
      {
        publishers: Set<string>;
        releaseDates: Set<string>;
        platforms: Set<string>;
        websites: Set<string>;
        externalPages: Map<string, IExternalPageField>;
        releases: Map<string, IVndbReleaseEntry>;
        publisherNames: Set<string>;
      }
    >();
    if (!vnIds.length) return new Map();

    for (let i = 0; i < vnIds.length; i += VNDB_RELEASE_ID_CHUNK_SIZE) {
      const chunk = vnIds.slice(i, i + VNDB_RELEASE_ID_CHUNK_SIZE);
      const wanted = new Set(chunk);
      const filters: TVndbFilters = [
        "or",
        ...chunk.map((id): TVndbFilter => [
          "vn",
          "=",
          ["id", "=", id] satisfies TVndbFilter,
        ]),
      ];

      let page = 1;
      let more = true;

      while (more) {
        const data = await this.post<IVndbReleaseResponse>("/release", {
          filters,
          fields:
            "official,released,platforms,vns.id,producers.name,producers.original,producers.aliases,producers.publisher,extlinks.id,extlinks.url,extlinks.name,extlinks.label,languages.lang",
          results: VNDB_RELEASE_PAGE_SIZE,
          page,
        });

        for (const release of data.results) {
          if (!release.official) continue;

          const publishers = (release.producers ?? [])
            .filter(({ publisher }) => publisher)
            .flatMap(({ name, original, aliases }) => [
              name,
              original,
              ...(aliases ?? []),
            ])
            .filter((name): name is string => !!name);

          const [language, ...otherLanguages] = release.languages ?? [];
          const region =
            language && !otherLanguages.length
              ? (VNDB_LANGUAGE_REGIONS[language.lang] ?? VNDB_WORLDWIDE_REGION)
              : VNDB_WORLDWIDE_REGION;

          for (const { id } of release.vns ?? []) {
            if (!wanted.has(id)) continue;

            const signals = signalsByVn.get(id) ?? {
              publishers: new Set<string>(),
              releaseDates: new Set<string>(),
              platforms: new Set<string>(),
              websites: new Set<string>(),
              externalPages: new Map<string, IExternalPageField>(),
              releases: new Map<string, IVndbReleaseEntry>(),
              publisherNames: new Set<string>(),
            };

            publishers.forEach((name) => signals.publishers.add(name));
            (release.producers ?? [])
              .filter(({ publisher }) => publisher)
              .forEach(({ name }) => signals.publisherNames.add(name));
            if (release.released) signals.releaseDates.add(release.released);
            (release.platforms ?? []).forEach((platform) =>
              signals.platforms.add(platform)
            );
            for (const platform of release.platforms ?? []) {
              if (!release.released) continue;

              signals.releases.set(
                `${release.released}-${platform}-${region}`,
                {
                  released: release.released,
                  platform,
                  region,
                }
              );
            }
            for (const { id: uid, name, label, url } of release.extlinks ??
              []) {
              if (name === VNDB_WEBSITE_LINK) {
                signals.websites.add(url);
              } else if (!VNDB_IGNORED_LINKS.includes(name)) {
                const pageName = VNDB_STORE_NAMES[name] ?? label;

                if (!signals.externalPages.has(pageName)) {
                  signals.externalPages.set(pageName, {
                    name: pageName,
                    uid: String(uid ?? url),
                    url,
                  });
                }
              }
            }

            signalsByVn.set(id, signals);
          }
        }

        more = data.more;
        page++;
      }
    }

    return new Map(
      [...signalsByVn].map(([id, signals]) => [
        id,
        {
          publishers: [...signals.publishers],
          releaseDates: [...signals.releaseDates],
          platforms: [...signals.platforms],
          websites: [...signals.websites],
          externalPages: [...signals.externalPages.values()],
          releases: [...signals.releases.values()],
          publisherNames: [...signals.publisherNames],
        },
      ])
    );
  }

  private getTitles(
    vn: IVndbNovel,
    themes: string[],
    characters: IVndbCharacter[]
  ): IVndbTitles {
    const englishTitles = vn.titles.filter(({ lang }) => lang === "en");
    const mainTitle = vn.titles.find(({ main }) => main);

    const name =
      englishTitles.find(({ official }) => official)?.title ??
      englishTitles[0]?.title ??
      vn.title;

    const alternativeNames = [
      vn.title,
      vn.alttitle,
      ...vn.titles.flatMap(({ title, latin }) => [title, latin]),
    ].filter((title): title is string => !!title && title !== name);

    const firstRelease = parsePartialDate(vn.released);
    const hasExplicitImages = [vn.image, ...(vn.screenshots ?? [])].some(
      (image) => image && image.sexual > VNDB_EXPLICIT_SEXUAL_LEVEL
    );

    return {
      id: vn.id,
      name,
      released: vn.released,
      description: vn.description ?? "",
      originalName: mainTitle?.title ?? vn.alttitle ?? vn.title,
      alternativeNames: [...new Set(alternativeNames)],
      developers: [
        ...new Set(
          (vn.developers ?? [])
            .flatMap(({ name, original, aliases }) => [
              name,
              original,
              ...(aliases ?? []),
            ])
            .filter((name): name is string => !!name)
        ),
      ],
      publishers: [],
      companies: (vn.developers ?? []).map(({ name }) => ({
        name,
        developer: true,
        publisher: false,
        porting: false,
        supporting: false,
      })),
      releaseDates: vn.released ? [vn.released] : [],
      platforms: vn.platforms ?? [],
      platformIds: [],
      cover: vn.image,
      themes,
      characters: characters
        .filter(({ vns }) => vns.some(({ id }) => id === vn.id))
        .map(({ id }) => id),
      screenshots: vn.screenshots,
      length: vn.length_minutes,
      websites: (vn.extlinks ?? [])
        .filter(({ name }) => VNDB_WIKI_LINKS.includes(name))
        .map(({ url }) => url),
      keywords: (vn.tags ?? [])
        .filter(
          ({ id, category, rating, spoiler, lie }) =>
            category !== "ero" &&
            rating >= VNDB_KEYWORD_MIN_RATING &&
            spoiler === 0 &&
            !lie &&
            !VNDB_THEME_TAGS[id]
        )
        .map(({ name }) => name)
        .concat(hasExplicitImages ? [VNDB_EXPLICIT_IMAGES_KEYWORD] : []),
      first_release: firstRelease ? Math.floor(+firstRelease / 1000) : null,
      release_dates: [],
      status: VNDB_STATUS_NAMES[vn.devstatus] ?? null,
      player_perspectives: [],
      languages: (vn.languages ?? []).map((code) => languageNames.of(code)),
      externalPages: [],
      rating: vn.rating,
      votecount: vn.votecount,
      relations: (vn.relations ?? [])
        .filter(({ relation_official }) => relation_official)
        .map(({ id, relation }) => ({ vnId: id, relation })),
      type: (vn.relations ?? []).some(
        ({ relation, relation_official }) =>
          relation === VNDB_ORIGINAL_RELATION && relation_official
      )
        ? FAN_DISC_GAME_TYPE
        : MAIN_GAME_TYPE,
    };
  }
}

type TVndbSyncTotals = Record<
  | "vns"
  | "matched"
  | "ambiguous"
  | "absent"
  | "created"
  | "updated"
  | "unchanged"
  | "failed"
  | "covers"
  | "screenshots"
  | "characters",
  number
>;

type TVndbReleaseDate = Omit<IReleaseDate, "platformId"> & {
  platformId: Types.ObjectId;
};

export const toVndbMatchSubject = (vn: IVndbTitles): IMatchSubject => ({
  id: vn.id,
  name: vn.name,
  originalName: vn.originalName,
  alternativeNames: vn.alternativeNames,
  type: vn.type,
  releaseDates: vn.releaseDates,
  developers: vn.developers,
  publishers: vn.publishers,
  platformSlugs: vn.platforms.flatMap(
    (platform) => VNDB_PLATFORM_SLUGS[platform] ?? []
  ),
  description: vn.description,
});

export interface IVndbTitles {
  id: string;
  type: string;
  companies: ICompanyField[];
  platformIds: Types.ObjectId[];
  relations: { vnId: string; relation: string }[];
  name: string;
  released: string;
  description: string;
  originalName: string;
  alternativeNames: string[];
  developers: string[];
  publishers: string[];
  releaseDates: string[];
  platforms: string[];
  cover: IVndbImage;
  keywords: string[];
  themes: string[];
  characters: string[];
  screenshots: IVndbImage[];
  websites: string[];
  first_release: number;
  release_dates: TVndbReleaseDate[];
  status: string;
  player_perspectives: string[];
  languages: string[];
  externalPages: IExternalPageField[];
  length: number;
  rating: number;
  votecount: number;
}
