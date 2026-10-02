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
  type IGetMyContentRequestsQuery,
  type IPossibleDuplicate,
  POSSIBLE_DUPLICATES_MESSAGE,
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
import { parseS3ImageUrl, S3_FOLDERS, type S3Folder } from "../../../shared/s3";
import { FRONT_URL } from "../../../shared/constants";
import { normalizeGameName, uniqueSlug } from "../../../shared/utils";
import { MAIN_GAME_TYPE } from "../constants/vndb";
import { IGDBService } from "../../igdb/igdb.service";
import { HltbService } from "./hltb.service";
import { NotificationsService } from "../../notifications/services/notifications.service";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import { GameMatcherService } from "../matching/game-matcher.service";
import { VndbService } from "./vndb.service";
import { escapeRegExp } from "../../collections/utils/collections.utils";

const PENDING_REQUESTS_LIMIT = 20;
const CLAIM_TTL_MS = 15 * 60 * 1000;
const ALREADY_DECIDED =
  "This request has already been decided, or another moderator is deciding it";
const ROLLBACK_IMAGE_KEYS = [
  "cover",
  "screenshots",
  "artworks",
  "backgroundImage",
  "bannerImage",
  "mugShot",
];
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

interface IApproval {
  createdId: mongoose.Types.ObjectId | null;
  uploaded: string[];
  failedImages: string[];
  warnings: string[];
}

type IRequestCompany = NonNullable<IGameRequestPayload["companies"]>[number];

const toObjectIds = (ids: string[] = []) =>
  ids.map((id) => new mongoose.Types.ObjectId(id));

const undecided = () => ({
  status: "pending",
  $or: [
    { claimedAt: null },
    { claimedAt: { $lt: new Date(Date.now() - CLAIM_TTL_MS) } },
  ],
});

const withCompanyNames = (
  base: IRequestCompany[],
  payload: IGameRequestPayload
) => {
  const companies = base.map((company) => ({ ...company }));

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

  return companies;
};

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
    private readonly vndb: VndbService,
    private readonly gameMatcher: GameMatcherService,
    private readonly conflicts: ConflictsService,
    private readonly notifications: NotificationsService
  ) {}

  async create(userId: string, dto: ICreateContentRequestParsed) {
    const countPending = () =>
      this.requests.countDocuments({
        userId: new mongoose.Types.ObjectId(userId),
        status: "pending",
      });
    const limitReached = new ConflictException(
      `You already have ${PENDING_REQUESTS_LIMIT} pending requests`
    );

    if ((await countPending()) >= PENDING_REQUESTS_LIMIT) throw limitReached;

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

    if ((await countPending()) > PENDING_REQUESTS_LIMIT) {
      await this.requests.deleteOne({ _id: request._id });
      throw limitReached;
    }

    const [decorated] = await this.decorate([request.toObject()]);

    return decorated;
  }

  async listMine(
    userId: string,
    { page, take }: IGetMyContentRequestsQuery
  ): Promise<IGetContentRequestsResponse> {
    const filter = { userId: new mongoose.Types.ObjectId(userId) };
    const [requests, total] = await Promise.all([
      this.requests
        .find(filter)
        .sort({ createdAt: -1 })
        .skip((page - 1) * take)
        .limit(take)
        .lean<ILeanRequest[]>(),
      this.requests.countDocuments(filter),
    ]);

    return { results: await this.decorate(requests), total };
  }

  async withdraw(userId: string, id: string) {
    const request = await this.findRequest(id);

    if (request.userId.toString() !== userId) {
      throw new ForbiddenException("This request belongs to someone else");
    }

    const { matchedCount } = await this.requests.updateOne(
      { _id: request._id, ...undecided() },
      { $set: { status: "withdrawn", decidedAt: new Date().toISOString() } }
    );

    if (!matchedCount) {
      throw new ConflictException(
        "Only a pending request that no moderator is deciding can be withdrawn"
      );
    }

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

    const [requests, total] = await Promise.all([
      this.requests
        .find(filter)
        .sort({ createdAt: status === "pending" ? 1 : -1 })
        .skip((page - 1) * take)
        .limit(take)
        .lean<ILeanRequest[]>(),
      this.requests.countDocuments(filter),
    ]);

    return { results: await this.decorate(requests), total };
  }

  async get(id: string): Promise<IContentRequestDetail> {
    const request = await this.findRequest(id);
    const [decorated] = await this.decorate([request]);

    return { ...decorated, current: await this.getCurrent(request) };
  }

  async decide(
    adminId: string,
    id: string,
    { decision, fields, reason, lockSync, force }: IDecideContentRequest
  ): Promise<IDecideContentRequestResponse> {
    const request = await this.findRequest(id);

    if (request.status !== "pending") {
      throw new ConflictException(ALREADY_DECIDED);
    }

    const decidedAt = new Date().toISOString();
    const decidedBy = new mongoose.Types.ObjectId(adminId);

    if (decision === "reject") {
      const { matchedCount } = await this.requests.updateOne(
        { _id: request._id, ...undecided() },
        { $set: { status: "rejected", reason, decidedAt, decidedBy } }
      );

      if (!matchedCount) throw new ConflictException(ALREADY_DECIDED);

      const decided = await this.decorateOne(request._id);

      this.notifyDecision(request, decided);

      return { request: decided, failedImages: [], warnings: [] };
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

    const claimedAt = new Date();
    const claimed = await this.requests.findOneAndUpdate(
      { _id: request._id, ...undecided() },
      { $set: { claimedAt, claimedBy: decidedBy } }
    );

    if (!claimed) throw new ConflictException(ALREADY_DECIDED);

    const approval: IApproval = {
      createdId: null,
      uploaded: [],
      failedImages: [],
      warnings: [],
    };

    try {
      const resultId =
        request.kind === "game"
          ? await this.applyGame(
              request,
              payload as IGameRequestPayload,
              approval,
              lockSync,
              force
            )
          : await this.applyCharacter(
              request,
              payload as ICharacterRequestPayload,
              approval,
              force
            );

      const { matchedCount } = await this.requests.updateOne(
        { _id: request._id, status: "pending", claimedAt },
        {
          $set: {
            status: "approved",
            appliedFields: applied,
            resultId,
            reason: reason || null,
            decidedAt,
            decidedBy,
            claimedAt: null,
            claimedBy: null,
          },
        }
      );

      if (!matchedCount) throw new ConflictException(ALREADY_DECIDED);

      const decided = await this.decorateOne(request._id);

      this.notifyDecision(request, decided);

      return {
        request: decided,
        failedImages: approval.failedImages,
        warnings: approval.warnings,
      };
    } catch (err) {
      this.logger.error(err, `Failed to approve content request: ${id}`);
      await this.rollback(request.kind, approval);
      await this.requests
        .updateOne(
          { _id: request._id, status: "pending", claimedAt },
          { $set: { claimedAt: null, claimedBy: null } }
        )
        .catch((releaseErr: Error) =>
          this.logger.error(releaseErr, `Failed to release request: ${id}`)
        );
      throw err;
    }
  }

  private notifyDecision(request: ILeanRequest, decided: IContentRequest) {
    const name = request.payload.name;

    void this.notifications.notify({
      userId: request.userId,
      type: "request-decided",
      subjectId: request._id,
      payload: {
        decision: decided.status === "approved" ? "approved" : "rejected",
        requestKind: request.kind,
        requestName:
          decided.targetName ?? (typeof name === "string" ? name : null),
        reason: decided.reason ?? null,
      },
    });
  }

  private async rollback(kind: string, approval: IApproval) {
    try {
      const urls = [...approval.uploaded];

      if (approval.createdId) {
        const entry = await this.targetModel(kind)
          .findByIdAndDelete(approval.createdId)
          .lean<Record<string, unknown>>();

        ROLLBACK_IMAGE_KEYS.forEach((key) => {
          const value = entry?.[key];

          if (typeof value === "string") urls.push(value);
          if (Array.isArray(value)) urls.push(...value.map(String));
        });
      }

      const keysByFolder = new Map<S3Folder, Set<string>>();

      urls.forEach((url) => {
        const ref = parseS3ImageUrl(url);

        if (!ref) return;

        keysByFolder.set(
          ref.folder,
          (keysByFolder.get(ref.folder) ?? new Set()).add(ref.key)
        );
      });

      for (const [folder, keys] of keysByFolder) {
        await this.fileService.deleteFiles([...keys], folder);
      }
    } catch (err) {
      this.logger.error(err, "Failed to roll back a content request approval");
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
      const character = await this.characters.findById(request.targetId).lean();

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
    approval: IApproval
  ) {
    const uploaded: string[] = [];

    for (const url of urls) {
      try {
        const stored = await this.fileService.uploadRemoteImage(
          url,
          `${ownerId}/${new mongoose.Types.ObjectId()}`,
          folder
        );

        uploaded.push(stored);
        approval.uploaded.push(stored);
      } catch (err) {
        this.logger.warn(
          `Skipped request image ${url}: ${(err as Error).message}`
        );
        approval.failedImages.push(url);
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
    approval: IApproval,
    lockSync?: boolean,
    force?: boolean
  ) {
    const { warnings } = approval;
    const now = new Date().toISOString();
    let isIgdbParsed = false;
    let game = request.targetId
      ? await this.games.findById(request.targetId).lean()
      : null;

    if (request.action === "update" && !game) {
      throw new NotFoundException("The game no longer exists");
    }

    if (!game && payload.igdbId) {
      const existed = await this.games.exists({
        "igdb.gameId": payload.igdbId,
      });

      isIgdbParsed = true;
      game = await this.parseIgdb(payload.igdbId, warnings);

      if (game && !existed) approval.createdId = game._id;
    }

    if (!game) {
      if (!payload.name) {
        throw new BadRequestException(
          warnings[0] ?? "A new game needs a name or a working IGDB id"
        );
      }

      if (!force) {
        await this.gameMatcher.assertNoDuplicates({
          name: payload.name,
          alternative_names: payload.alternative_names,
          type: payload.type,
          first_release: payload.first_release,
          companies: withCompanyNames(payload.companies ?? [], payload),
          platformIds: payload.platformIds,
          summary: payload.summary,
        });
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
      approval.createdId = game._id;
      this.indexNow.submitUrl(`${FRONT_URL}/games/${game.slug}`);
    }

    const gameId = game._id;

    if (
      payload.igdbId &&
      !isIgdbParsed &&
      game.igdb?.gameId !== payload.igdbId
    ) {
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
    const set = await this.buildGameSet(fresh, payload, gameId, approval);

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

    if (payload.retroachievements?.length) {
      await this.conflicts.pin(
        "ra",
        payload.retroachievements.map(({ gameId: raId }) => String(raId)),
        gameId
      );
    }

    if (!approval.createdId) approval.uploaded = [];

    return gameId;
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
    game: { _id: mongoose.Types.ObjectId; vndb?: { vnId?: string } },
    igdbId: number,
    warnings: string[]
  ) {
    if (game.vndb?.vnId) {
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
    approval: IApproval
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
      set.companies = withCompanyNames(
        payload.companies ?? game.companies ?? [],
        payload
      );
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

        related[key] = [...new Set([...current, ...known.map(String)])].filter(
          (id) => id !== gameId.toString()
        );
      }

      if (payload.parentGameId && payload.parentGameId !== gameId.toString()) {
        const [parent] = await this.existingIds(this.games as Model<unknown>, [
          payload.parentGameId,
        ]);

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
        approval
      );

      if (cover) set.cover = cover;
    }

    for (const [key, folder] of [
      ["screenshots", S3_FOLDERS.screenshots],
      ["artworks", S3_FOLDERS.artworks],
    ] as const) {
      const urls = payload[key];

      if (!urls?.length) continue;

      const uploaded = await this.uploadImages(urls, folder, gameId, approval);

      set[key] = [...((game[key] as string[]) ?? []), ...uploaded];
    }

    return set;
  }

  private async applyCharacter(
    request: ILeanRequest,
    payload: ICharacterRequestPayload,
    approval: IApproval,
    force?: boolean
  ) {
    const existing = request.targetId
      ? await this.characters.findById(request.targetId).lean()
      : null;

    if (request.action === "update" && !existing) {
      throw new NotFoundException("The character no longer exists");
    }

    const gameIds = await this.existingIds(
      this.games as Model<unknown>,
      payload.gameIds
    );

    if (!existing && !force) {
      await this.assertNoDuplicateCharacters(payload, gameIds);
    }

    const characterId = existing?._id ?? new mongoose.Types.ObjectId();
    const now = new Date().toISOString();
    const set: Record<string, unknown> = {};

    for (const [key, value] of Object.entries(payload)) {
      if (IMAGE_FIELDS.has(key) || key === "gameIds") continue;

      set[key] = value;
    }

    if (payload.mugShot) {
      const [mugShot] = await this.uploadImages(
        [payload.mugShot],
        S3_FOLDERS.characters,
        characterId,
        approval
      );

      if (mugShot) set.mugShot = mugShot;
    }

    if (existing) {
      await this.characters.updateOne(
        { _id: characterId },
        {
          $set: { ...set, updatedAt: now },
          ...(payload.gameIds && {
            $addToSet: { gameIds: { $each: gameIds } },
          }),
        }
      );
      approval.uploaded = [];
    } else {
      await this.characters.create({
        _id: characterId,
        akas: [],
        ...set,
        gameIds,
        slug: await uniqueSlug(
          (candidate) => this.characters.exists({ slug: candidate }),
          payload.name!
        ),
        createdAt: now,
        updatedAt: now,
      });
      approval.createdId = characterId;
    }

    return characterId;
  }

  private async assertNoDuplicateCharacters(
    payload: ICharacterRequestPayload,
    gameIds: mongoose.Types.ObjectId[]
  ) {
    const patterns = [payload.name, ...(payload.akas ?? [])]
      .filter((name): name is string => !!name?.trim())
      .map((name) => new RegExp(`^${escapeRegExp(name.trim())}$`, "i"));

    if (!patterns.length) return;

    const matches = await this.characters
      .find({
        $or: [{ name: { $in: patterns } }, { akas: { $in: patterns } }],
        ...(gameIds.length && { gameIds: { $in: gameIds } }),
      })
      .select("_id name slug")
      .limit(10)
      .lean<{ _id: mongoose.Types.ObjectId; name: string; slug: string }[]>();

    if (!matches.length) return;

    const duplicates: IPossibleDuplicate[] = matches.map((character) => ({
      _id: character._id.toString(),
      name: character.name,
      slug: character.slug,
      score: 1,
    }));

    throw new ConflictException({
      message: POSSIBLE_DUPLICATES_MESSAGE,
      duplicates,
    });
  }
}
