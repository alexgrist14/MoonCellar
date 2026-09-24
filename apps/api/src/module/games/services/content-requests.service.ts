import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type Model } from "mongoose";
import {
  CHARACTER_REQUEST_FIELDS,
  GAME_REQUEST_FIELDS,
  type ICharacterRequestPayload,
  type IContentRequest,
  type IContentRequestDetail,
  type ICreateContentRequestParsed,
  type IDecideContentRequest,
  type IDecideContentRequestResponse,
  type IGameRequestPayload,
  type IGetContentRequestsQuery,
  type IGetContentRequestsResponse,
} from "@mooncellar/schemas";
import {
  ContentRequest,
  type ContentRequestDocument,
} from "../schemas/content-request.schema";
import { Game, type GameDocument } from "../schemas/game.schema";
import { Character } from "../schemas/character.schema";
import { Platform } from "../schemas/platform.schema";
import { User } from "../../user/schemas/user.schema";
import { FileService } from "../../user/services/file-upload.service";
import { IndexNowService } from "../../indexnow/indexnow.service";
import { S3_FOLDERS, type S3Folder } from "../../../shared/s3";
import { FRONT_URL } from "../../../shared/constants";
import { normalizeGameName, uniqueSlug } from "../../../shared/utils";
import { MAIN_GAME_TYPE } from "../constants/vndb";
import { IGDBService } from "../../igdb/igdb.service";
import { HltbService } from "./hltb.service";
import { VndbService } from "./vndb.service";

const PENDING_REQUESTS_LIMIT = 20;
const IMAGE_FIELDS = new Set(["mugShot"]);
const WORLDWIDE_REGION = 8;
const GAME_SPECIAL_FIELDS = new Set([
  "platformIds",
  "release_dates",
  "companies",
  "developer",
  "publisher",
  "relatedGames",
  "parentGameId",
  "retroachievements",
  "cover",
  "screenshots",
  "artworks",
  "igdbId",
  "vndbId",
  "hltbId",
]);

type ILeanRequest = ContentRequest & { _id: mongoose.Types.ObjectId };

const toObjectIds = (ids: string[] = []) =>
  ids.map((id) => new mongoose.Types.ObjectId(id));

@Injectable()
export class ContentRequestsService {
  private readonly logger = new Logger(ContentRequestsService.name);

  constructor(
    @InjectModel(ContentRequest.name)
    private readonly requests: Model<ContentRequestDocument>,
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    @InjectModel(Character.name)
    private readonly characters: Model<Character>,
    @InjectModel(Platform.name) private readonly platforms: Model<Platform>,
    @InjectModel(User.name) private readonly users: Model<User>,
    private readonly fileService: FileService,
    private readonly indexNow: IndexNowService,
    private readonly igdb: IGDBService,
    private readonly hltb: HltbService,
    private readonly vndb: VndbService
  ) {}

  async create(userId: string, dto: ICreateContentRequestParsed) {
    const pending = await this.requests.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      status: "pending",
    });

    if (pending >= PENDING_REQUESTS_LIMIT) {
      throw new ConflictException(
        `You already have ${PENDING_REQUESTS_LIMIT} pending requests`
      );
    }

    if (dto.action === "update") {
      const exists = await this.targetModel(dto.kind).exists({
        _id: dto.targetId,
      });

      if (!exists) throw new NotFoundException("Nothing to update found");
    }

    const request = await this.requests.create({
      kind: dto.kind,
      action: dto.action,
      targetId: dto.action === "update" ? dto.targetId : null,
      payload: dto.payload,
      sources: dto.sources,
      note: dto.note || null,
      userId: new mongoose.Types.ObjectId(userId),
      createdAt: new Date().toISOString(),
    });

    const [decorated] = await this.decorate([request.toObject()]);

    return decorated;
  }

  async listMine(userId: string) {
    const requests = await this.requests
      .find({ userId: new mongoose.Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean<ILeanRequest[]>();

    return this.decorate(requests);
  }

  async withdraw(userId: string, id: string) {
    const request = await this.findRequest(id);

    if (request.userId.toString() !== userId) {
      throw new ForbiddenException("This request belongs to someone else");
    }

    if (request.status !== "pending") {
      throw new ConflictException("Only a pending request can be withdrawn");
    }

    await this.requests.updateOne(
      { _id: request._id },
      { $set: { status: "withdrawn", decidedAt: new Date().toISOString() } }
    );

    return { success: true };
  }

  async list({
    status,
    kind,
    page,
    take,
  }: IGetContentRequestsQuery): Promise<IGetContentRequestsResponse> {
    const filter = {
      ...(status && { status }),
      ...(kind && { kind }),
    };

    const [requests, total, pending] = await Promise.all([
      this.requests
        .find(filter)
        .sort({ createdAt: status === "pending" ? 1 : -1 })
        .skip((page - 1) * take)
        .limit(take)
        .lean<ILeanRequest[]>(),
      this.requests.countDocuments(filter),
      this.requests.countDocuments({ status: "pending" }),
    ]);

    return { results: await this.decorate(requests), total, pending };
  }

  async get(id: string): Promise<IContentRequestDetail> {
    const request = await this.findRequest(id);
    const [decorated] = await this.decorate([request]);

    return { ...decorated, current: await this.getCurrent(request) };
  }

  async decide(
    adminId: string,
    id: string,
    { decision, fields, reason, lockSync }: IDecideContentRequest
  ): Promise<IDecideContentRequestResponse> {
    const request = await this.findRequest(id);

    if (request.status !== "pending") {
      throw new ConflictException("This request has already been decided");
    }

    const decidedAt = new Date().toISOString();
    const decidedBy = new mongoose.Types.ObjectId(adminId);

    if (decision === "reject") {
      await this.requests.updateOne(
        { _id: request._id, status: "pending" },
        { $set: { status: "rejected", reason, decidedAt, decidedBy } }
      );

      return {
        request: await this.decorateOne(request._id),
        failedImages: [],
        warnings: [],
      };
    }

    const allowed = (
      request.kind === "game" ? GAME_REQUEST_FIELDS : CHARACTER_REQUEST_FIELDS
    ) as readonly string[];
    const applied = Object.keys(request.payload).filter(
      (key) => allowed.includes(key) && (!fields || fields.includes(key))
    );

    if (!applied.length) {
      throw new BadRequestException("Pick at least one field to apply");
    }

    if (
      request.action === "add" &&
      !["name", "igdbId", "vndbId"].some((key) => applied.includes(key))
    ) {
      throw new BadRequestException(
        "A new entry needs its name or a source id applied"
      );
    }

    const payload = Object.fromEntries(
      applied.map((key) => [key, request.payload[key]])
    );

    try {
      const { resultId, failedImages, warnings } =
        request.kind === "game"
          ? await this.applyGame(request, payload as IGameRequestPayload, lockSync)
          : await this.applyCharacter(
              request,
              payload as ICharacterRequestPayload
            );

      await this.requests.updateOne(
        { _id: request._id },
        {
          $set: {
            status: "approved",
            appliedFields: applied,
            resultId,
            reason: reason || null,
            decidedAt,
            decidedBy,
          },
        }
      );

      return {
        request: await this.decorateOne(request._id),
        failedImages,
        warnings,
      };
    } catch (err) {
      this.logger.error(err, `Failed to approve content request: ${id}`);
      throw err;
    }
  }

  private targetModel(kind: string): Model<unknown> {
    return (kind === "game" ? this.games : this.characters) as Model<unknown>;
  }

  private async findRequest(id: string): Promise<ILeanRequest> {
    if (!mongoose.isValidObjectId(id)) {
      throw new BadRequestException(`Invalid request id: ${id}`);
    }

    const request = await this.requests.findById(id).lean<ILeanRequest>();

    if (!request) throw new NotFoundException(`Request not found: ${id}`);

    return request;
  }

  private async decorateOne(id: mongoose.Types.ObjectId) {
    const request = await this.requests.findById(id).lean<ILeanRequest>();
    const [decorated] = await this.decorate([request!]);

    return decorated;
  }

  private async decorate(requests: ILeanRequest[]): Promise<IContentRequest[]> {
    const entityIds = (kind: string) =>
      requests
        .filter((request) => request.kind === kind)
        .flatMap((request) => [request.targetId, request.resultId])
        .filter((value): value is mongoose.Types.ObjectId => !!value);

    const [users, games, characters] = await Promise.all([
      this.users
        .find({ _id: { $in: requests.map((request) => request.userId) } })
        .select("_id userName")
        .lean(),
      this.games
        .find({ _id: { $in: entityIds("game") } })
        .select("_id name slug")
        .lean(),
      this.characters
        .find({ _id: { $in: entityIds("character") } })
        .select("_id name slug")
        .lean(),
    ]);

    const userNames = new Map(
      users.map((user) => [user._id.toString(), user.userName])
    );
    const entities = new Map<string, { name: string; slug: string }>(
      [...games, ...characters].map((entity) => [
        entity._id.toString(),
        { name: entity.name, slug: entity.slug },
      ])
    );

    return requests.map((request) => {
      const target = request.targetId
        ? entities.get(request.targetId.toString())
        : undefined;
      const result = request.resultId
        ? entities.get(request.resultId.toString())
        : undefined;

      return {
        _id: request._id.toString(),
        kind: request.kind,
        action: request.action,
        status: request.status,
        targetId: request.targetId?.toString() ?? null,
        targetName: target?.name ?? null,
        targetSlug: target?.slug ?? null,
        payload: request.payload,
        sources: request.sources ?? [],
        note: request.note,
        reason: request.reason,
        appliedFields: request.appliedFields,
        userId: request.userId.toString(),
        userName: userNames.get(request.userId.toString()) ?? null,
        resultId: request.resultId?.toString() ?? null,
        resultSlug: result?.slug ?? null,
        createdAt: request.createdAt,
        decidedAt: request.decidedAt,
      };
    });
  }

  private async getCurrent(
    request: ILeanRequest
  ): Promise<Record<string, unknown> | null> {
    if (!request.targetId) return null;

    const keys = Object.keys(request.payload);

    if (request.kind === "character") {
      const character = await this.characters
        .findById(request.targetId)
        .lean();

      if (!character) return null;

      return Object.fromEntries(
        keys.map((key) => [
          key,
          key === "gameIds"
            ? (character.gameIds ?? []).map(String)
            : (character as unknown as Record<string, unknown>)[key],
        ])
      );
    }

    const game = await this.games.findById(request.targetId).lean();

    if (!game) return null;

    const companyName = (flag: "developer" | "publisher") =>
      game.companies?.find((company) => company[flag])?.name;

    const special: Record<string, () => unknown> = {
      developer: () => companyName("developer"),
      publisher: () => companyName("publisher"),
      platformIds: () => (game.platformIds ?? []).map(String),
      igdbId: () => game.igdb?.gameId,
      vndbId: () => game.vndb?.vnId,
      hltbId: () => game.hltb?.hltbId,
      parentGameId: () => game.relatedGames?.parent_game,
    };

    return Object.fromEntries(
      keys.map((key) => [
        key,
        special[key]
          ? special[key]()
          : (game as unknown as Record<string, unknown>)[key],
      ])
    );
  }

  private async uploadImages(
    urls: string[],
    folder: S3Folder,
    ownerId: mongoose.Types.ObjectId,
    failedImages: string[]
  ) {
    const uploaded: string[] = [];

    for (const url of urls) {
      try {
        uploaded.push(
          await this.fileService.uploadRemoteImage(
            url,
            `${ownerId}/${new mongoose.Types.ObjectId()}`,
            folder
          )
        );
      } catch (err) {
        this.logger.warn(
          `Skipped request image ${url}: ${(err as Error).message}`
        );
        failedImages.push(url);
      }
    }

    return uploaded;
  }

  private async existingIds(model: Model<unknown>, ids?: string[]) {
    if (!ids?.length) return [];

    const found = await model
      .find({ _id: { $in: toObjectIds(ids) } })
      .select("_id")
      .lean<{ _id: mongoose.Types.ObjectId }[]>();
    const known = new Set(found.map(({ _id }) => _id.toString()));

    return toObjectIds(ids.filter((id) => known.has(id)));
  }

  private async applyGame(
    request: ILeanRequest,
    payload: IGameRequestPayload,
    lockSync?: boolean
  ) {
    const failedImages: string[] = [];
    const warnings: string[] = [];
    const now = new Date().toISOString();
    let game = request.targetId
      ? await this.games.findById(request.targetId).lean()
      : null;

    if (request.action === "update" && !game) {
      throw new NotFoundException("The game no longer exists");
    }

    if (!game && payload.igdbId) {
      game = await this.parseIgdb(payload.igdbId, warnings);
    }

    if (!game) {
      if (!payload.name) {
        throw new BadRequestException(
          warnings[0] ?? "A new game needs a name or a working IGDB id"
        );
      }

      const created = await this.games.create({
        type: MAIN_GAME_TYPE,
        cover: null,
        platformIds: [],
        name: payload.name,
        nameNormalized: normalizeGameName(payload.name),
        slug: await uniqueSlug(
          (candidate) => this.games.exists({ slug: candidate }),
          payload.name
        ),
        isCustom: true,
        createdAt: now,
        updatedAt: now,
      });

      game = created.toObject();
      this.indexNow.submitUrl(`${FRONT_URL}/games/${game.slug}`);
    }

    const gameId = game._id;

    if (payload.igdbId && game.igdb?.gameId !== payload.igdbId) {
      await this.linkIgdb(game, payload.igdbId, warnings);
    }

    if (payload.vndbId && game.vndb?.vnId !== payload.vndbId) {
      await this.linkVndb(gameId, payload.vndbId, warnings);
    }

    if (payload.hltbId) {
      await this.hltb
        .syncGame({ gameId: gameId.toString(), hltbId: payload.hltbId })
        .catch((err: Error) =>
          warnings.push(`HLTB ${payload.hltbId}: ${err.message}`)
        );
    }

    const fresh = (await this.games.findById(gameId).lean())!;
    const set = await this.buildGameSet(fresh, payload, gameId, failedImages);

    await this.games.updateOne(
      { _id: gameId },
      {
        $set: {
          ...set,
          ...(lockSync && { isStopParsing: true }),
          updatedAt: new Date().toISOString(),
        },
      }
    );

    return { resultId: gameId, failedImages, warnings };
  }

  private async parseIgdb(igdbId: number, warnings: string[]) {
    try {
      await this.igdb.parseGameFromIgdb({ igdbId }, { parseImages: true });
    } catch (err) {
      warnings.push(`IGDB ${igdbId}: ${(err as Error).message}`);
      return null;
    }

    return this.games.findOne({ "igdb.gameId": igdbId }).lean();
  }

  private async linkIgdb(
    game: { _id: mongoose.Types.ObjectId; vndb?: unknown },
    igdbId: number,
    warnings: string[]
  ) {
    if (game.vndb) {
      warnings.push(
        `IGDB ${igdbId}: the game belongs to VNDB, the IGDB sync never writes it`
      );
      return;
    }

    const owner = await this.games
      .findOne({ "igdb.gameId": igdbId, _id: { $ne: game._id } })
      .select("slug")
      .lean();

    if (owner) {
      warnings.push(`IGDB ${igdbId} already belongs to /games/${owner.slug}`);
      return;
    }

    await this.games.updateOne(
      { _id: game._id },
      { $set: { "igdb.gameId": igdbId } }
    );
    await this.parseIgdb(igdbId, warnings);
  }

  private async linkVndb(
    gameId: mongoose.Types.ObjectId,
    vnId: string,
    warnings: string[]
  ) {
    const owner = await this.games
      .findOne({ "vndb.vnId": vnId, _id: { $ne: gameId } })
      .select("slug")
      .lean();

    if (owner) {
      warnings.push(`VNDB ${vnId} already belongs to /games/${owner.slug}`);
      return;
    }

    await this.games.updateOne(
      { _id: gameId },
      { $set: { "vndb.vnId": vnId } }
    );

    try {
      const result = await this.vndb.parseGame(gameId.toString());

      if (result.status === "failed") warnings.push(result.message);
    } catch (err) {
      warnings.push(
        `VNDB ${vnId}: ${(err as Error).message}. The id is saved, parse it later from the game admin`
      );
    }
  }

  private async buildGameSet(
    game: GameDocument | (Record<string, unknown> & Partial<Game>),
    payload: IGameRequestPayload,
    gameId: mongoose.Types.ObjectId,
    failedImages: string[]
  ) {
    const set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (GAME_SPECIAL_FIELDS.has(key)) continue;

      set[key] = value;
    }

    if (payload.name) set.nameNormalized = normalizeGameName(payload.name);

    if (payload.platformIds) {
      set.platformIds = await this.existingIds(
        this.platforms as Model<unknown>,
        payload.platformIds
      );
    }

    if (payload.release_dates) {
      const platformIds = await this.existingIds(
        this.platforms as Model<unknown>,
        payload.release_dates.map((release) => release.platformId)
      );
      const known = new Set(platformIds.map(String));

      set.release_dates = payload.release_dates
        .filter((release) => known.has(release.platformId))
        .map((release) => {
          const date = new Date(release.date * 1000);

          return {
            date: release.date,
            human: date.toISOString().slice(0, 10),
            month: date.getUTCMonth() + 1,
            year: date.getUTCFullYear(),
            platformId: release.platformId,
            region: release.region ?? WORLDWIDE_REGION,
          };
        });
    }

    if (payload.companies || payload.developer || payload.publisher) {
      const companies = [...(payload.companies ?? game.companies ?? [])];

      (["developer", "publisher"] as const).forEach((flag) => {
        const name = payload[flag];

        if (!name) return;

        const match = companies.find((company) => company.name === name);

        if (match) {
          match[flag] = true;
          return;
        }

        companies.push({
          name,
          developer: flag === "developer",
          publisher: flag === "publisher",
          porting: false,
          supporting: false,
        });
      });

      set.companies = companies;
    }

    if (payload.relatedGames || payload.parentGameId) {
      const related: Record<string, unknown> = {
        ...((game.relatedGames as Record<string, unknown>) ?? {}),
      };

      for (const [key, ids] of Object.entries(payload.relatedGames ?? {})) {
        const known = await this.existingIds(
          this.games as Model<unknown>,
          ids ?? []
        );
        const current = ((related[key] as unknown[]) ?? []).map(String);

        related[key] = [
          ...new Set([...current, ...known.map(String)]),
        ].filter((id) => id !== gameId.toString());
      }

      if (payload.parentGameId && payload.parentGameId !== gameId.toString()) {
        const [parent] = await this.existingIds(
          this.games as Model<unknown>,
          [payload.parentGameId]
        );

        if (parent) related.parent_game = parent.toString();
      }

      set.relatedGames = related;
    }

    if (payload.retroachievements) {
      const current = (game.retroachievements ?? []) as {
        gameId: number;
        consoleId: number;
      }[];
      const merged = [...current];

      payload.retroachievements.forEach((entry) => {
        if (!merged.some((item) => item.gameId === entry.gameId)) {
          merged.push(entry);
        }
      });

      set.retroachievements = merged;
    }

    if (payload.cover) {
      const [cover] = await this.uploadImages(
        [payload.cover],
        S3_FOLDERS.covers,
        gameId,
        failedImages
      );

      if (cover) set.cover = cover;
    }

    for (const [key, folder] of [
      ["screenshots", S3_FOLDERS.screenshots],
      ["artworks", S3_FOLDERS.artworks],
    ] as const) {
      const urls = payload[key];

      if (!urls?.length) continue;

      const uploaded = await this.uploadImages(
        urls,
        folder,
        gameId,
        failedImages
      );

      set[key] = [...((game[key] as string[]) ?? []), ...uploaded];
    }

    return set;
  }

  private async applyCharacter(
    request: ILeanRequest,
    payload: ICharacterRequestPayload
  ) {
    const failedImages: string[] = [];
    const existing = request.targetId
      ? await this.characters.findById(request.targetId).lean()
      : null;

    if (request.action === "update" && !existing) {
      throw new NotFoundException("The character no longer exists");
    }

    const characterId = existing?._id ?? new mongoose.Types.ObjectId();
    const now = new Date().toISOString();
    const set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (IMAGE_FIELDS.has(key)) continue;

      set[key] =
        key === "gameIds"
          ? await this.existingIds(
              this.games as Model<unknown>,
              value as string[]
            )
          : value;
    }

    if (payload.mugShot) {
      const [mugShot] = await this.uploadImages(
        [payload.mugShot],
        S3_FOLDERS.characters,
        characterId,
        failedImages
      );

      if (mugShot) set.mugShot = mugShot;
    }

    if (existing) {
      await this.characters.updateOne(
        { _id: characterId },
        { $set: { ...set, updatedAt: now } }
      );
    } else {
      await this.characters.create({
        _id: characterId,
        akas: [],
        gameIds: [],
        ...set,
        slug: await uniqueSlug(
          (candidate) => this.characters.exists({ slug: candidate }),
          payload.name!
        ),
        createdAt: now,
        updatedAt: now,
      });
    }

    return { resultId: characterId, failedImages, warnings: [] as string[] };
  }
}
