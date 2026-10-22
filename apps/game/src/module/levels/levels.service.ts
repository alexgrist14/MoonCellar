import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { createHash } from "node:crypto";
import type {
  IGameAccount,
  IGameLevel,
  IGameLevelFile,
  IGameLevelList,
  IGameLevelListQuery,
  IGameLevelMode,
  IGameLevelOwnList,
  IGameLevelReportResult,
  IGameLevelReported,
  IGameLevelUpload,
} from "@mooncellar/schemas";
import type { Model, SortOrder } from "mongoose";
import { type IGameDefinition, levelBoard } from "../../games/game-definition";
import { Level } from "./schemas/level.schema";

type ILeanLevel = Level & { _id: { toString(): string } };

const LEVELS_PER_AUTHOR = 50;
const REPORTS_TO_HIDE = 3;

const escapeRegex = (text: string) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const levelHash = (data: Buffer) =>
  createHash("sha256").update(data).digest("hex");

const EMPTY_HASH = levelHash(Buffer.alloc(0));

@Injectable()
export class LevelsService {
  constructor(@InjectModel(Level.name) private readonly levels: Model<Level>) {}

  private limitsOf(game: IGameDefinition) {
    if (!game.levels) {
      throw new NotFoundException(`${game.name} takes no player levels`);
    }
    return game.levels;
  }

  private toLevel(row: ILeanLevel): IGameLevel {
    const id = row._id.toString();
    return {
      id,
      game: row.game,
      name: row.name,
      description: row.description,
      base: row.base,
      mode: row.mode === "bags" ? "bags" : "race",
      timeLimit: row.timeLimit ?? 0,
      authorId: row.authorId,
      authorName: row.authorName,
      version: row.version,
      board: levelBoard(id, row.version),
      size: row.size,
      hash: row.hash ?? "",
      rating: row.rating,
      ratings: row.ratingCount,
      downloads: row.downloads,
      createdAt: row.createdAt.toISOString(),
      updatedAt: row.updatedAt.toISOString(),
    };
  }

  private async visible(game: IGameDefinition, levelId: string, select = "") {
    this.limitsOf(game);
    const row = await this.levels
      .findOne({ _id: levelId, game: game.slug, hidden: false })
      .select(select);
    if (!row) throw new NotFoundException("This level is not available");
    return row;
  }

  // The level's map, checked by the game: a level that passes loads in the port
  private checked(game: IGameDefinition, base64: string, mode: IGameLevelMode) {
    const limits = this.limitsOf(game);
    const data = Buffer.from(base64, "base64");
    if (data.length > limits.maxBytes) {
      throw new UnprocessableEntityException(
        `The level is larger than ${limits.maxBytes / 1024} KiB`
      );
    }
    const rejection = limits.check?.(data, mode) ?? null;
    if (rejection) {
      throw new UnprocessableEntityException(
        `The level would not load in ${game.name}: ${rejection}`
      );
    }
    return data;
  }

  private async nameFree(
    game: IGameDefinition,
    account: IGameAccount,
    name: string,
    except?: unknown
  ) {
    const filter: Record<string, unknown> = {
      game: game.slug,
      authorId: account.id,
      name: new RegExp(`^${escapeRegex(name.trim())}$`, "i"),
    };
    if (except) filter._id = { $ne: except };
    if (await this.levels.exists(filter)) {
      throw new ConflictException(
        `You already have a level named "${name.trim()}". Upload a new version of it instead`
      );
    }
  }

  private async withHashes(rows: ILeanLevel[]) {
    for (const row of rows) {
      if (row.hash && row.hash !== EMPTY_HASH) continue;
      const stored = await this.levels.findById(row._id).select("+data");
      if (!stored?.data?.length) continue;
      row.hash = levelHash(Buffer.from(stored.data));
      await this.levels.updateOne(
        { _id: row._id },
        { $set: { hash: row.hash } }
      );
    }
    return rows;
  }

  async mine(
    game: IGameDefinition,
    account: IGameAccount
  ): Promise<IGameLevelOwnList> {
    this.limitsOf(game);
    const rows = await this.levels
      .find({ game: game.slug, authorId: account.id })
      .sort({ createdAt: -1 })
      .lean<ILeanLevel[]>();
    await this.withHashes(rows);
    return {
      game: game.slug,
      authorId: account.id,
      levels: rows.map((row) => ({
        ...this.toLevel(row),
        hidden: row.hidden,
      })),
    };
  }

  async list(
    game: IGameDefinition,
    query: IGameLevelListQuery
  ): Promise<IGameLevelList> {
    this.limitsOf(game);
    const filter: Record<string, unknown> = { game: game.slug, hidden: false };
    if (query.mode === "bags") filter.mode = "bags";
    if (query.mode === "race") filter.mode = { $ne: "bags" };
    if (query.q) {
      const pattern = new RegExp(escapeRegex(query.q), "i");
      filter.$or = [{ name: pattern }, { authorName: pattern }];
    }
    const sort: Record<string, SortOrder> =
      query.sort === "best"
        ? { rating: -1, ratingCount: -1, createdAt: -1 }
        : { createdAt: -1 };
    const [total, rows] = await Promise.all([
      this.levels.countDocuments(filter),
      this.levels
        .find(filter)
        .sort(sort)
        .skip(query.offset)
        .limit(query.limit)
        .lean<ILeanLevel[]>(),
    ]);
    return {
      game: game.slug,
      total,
      levels: rows.map((row) => this.toLevel(row)),
    };
  }

  async get(game: IGameDefinition, levelId: string): Promise<IGameLevel> {
    const row = await this.visible(game, levelId);
    const [level] = await this.withHashes([row.toObject() as ILeanLevel]);
    return this.toLevel(level);
  }

  async file(game: IGameDefinition, levelId: string): Promise<IGameLevelFile> {
    const row = await this.visible(game, levelId, "+data");
    await this.levels.updateOne({ _id: row._id }, { $inc: { downloads: 1 } });
    return {
      id: row._id.toString(),
      version: row.version,
      data: Buffer.from(row.data).toString("base64"),
    };
  }

  async upload(
    game: IGameDefinition,
    account: IGameAccount,
    dto: IGameLevelUpload
  ): Promise<IGameLevel> {
    const data = this.checked(game, dto.data, dto.mode);
    await this.nameFree(game, account, dto.name);
    const count = await this.levels.countDocuments({
      game: game.slug,
      authorId: account.id,
    });
    if (count >= LEVELS_PER_AUTHOR) {
      throw new ConflictException(
        `You already have ${LEVELS_PER_AUTHOR} levels. Delete one to upload another`
      );
    }
    const row = await this.levels.create({
      game: game.slug,
      authorId: account.id,
      authorName: account.userName,
      name: dto.name,
      description: dto.description,
      base: dto.base,
      mode: dto.mode,
      timeLimit: dto.timeLimit,
      data,
      size: data.length,
      hash: levelHash(data),
    });
    return this.toLevel(row.toObject() as ILeanLevel);
  }

  private async own(
    game: IGameDefinition,
    account: IGameAccount,
    levelId: string
  ) {
    this.limitsOf(game);
    const row = await this.levels.findOne({ _id: levelId, game: game.slug });
    if (!row) throw new NotFoundException("This level is not available");
    if (row.authorId !== account.id) {
      throw new ForbiddenException("Only the author can change this level");
    }
    return row;
  }

  // A new version: its leaderboard starts empty (the board carries the version)
  async update(
    game: IGameDefinition,
    account: IGameAccount,
    levelId: string,
    dto: IGameLevelUpload
  ): Promise<IGameLevel> {
    const row = await this.own(game, account, levelId);
    const data = this.checked(game, dto.data, dto.mode);
    await this.nameFree(game, account, dto.name, row._id);
    row.set({
      name: dto.name,
      description: dto.description,
      base: dto.base,
      mode: dto.mode,
      timeLimit: dto.timeLimit,
      data,
      size: data.length,
      hash: levelHash(data),
      version: row.version + 1,
      authorName: account.userName,
    });
    await row.save();
    return this.toLevel(row.toObject() as ILeanLevel);
  }

  async remove(game: IGameDefinition, account: IGameAccount, levelId: string) {
    const row = await this.own(game, account, levelId);
    await row.deleteOne();
    return { deleted: true as const };
  }

  async rate(
    game: IGameDefinition,
    account: IGameAccount,
    levelId: string,
    stars: number
  ): Promise<IGameLevel> {
    const row = await this.visible(game, levelId, "+ratingList");
    if (row.authorId === account.id) {
      throw new ForbiddenException("You cannot rate your own level");
    }
    const list = row.ratingList.filter((r) => r.userId !== account.id);
    list.push({ userId: account.id, stars });
    const sum = list.reduce((total, r) => total + r.stars, 0);
    row.set({
      ratingList: list,
      ratingSum: sum,
      ratingCount: list.length,
      rating: Math.round((sum / list.length) * 100) / 100,
    });
    await row.save();
    return this.toLevel(row.toObject() as ILeanLevel);
  }

  // Three players reporting a level hide it until a moderator looks at it
  async report(
    game: IGameDefinition,
    account: IGameAccount,
    levelId: string,
    reason: string
  ): Promise<IGameLevelReportResult> {
    const row = await this.visible(game, levelId, "+reports");
    if (row.authorId === account.id) {
      throw new ForbiddenException("You cannot report your own level");
    }
    const reports = row.reports.filter((r) => r.userId !== account.id);
    reports.push({ userId: account.id, reason, at: new Date() });
    const hidden = reports.length >= REPORTS_TO_HIDE;
    row.set({ reports, reportCount: reports.length, hidden });
    await row.save();
    return { reported: true, hidden };
  }

  async reported(game: IGameDefinition): Promise<IGameLevelReported[]> {
    this.limitsOf(game);
    const rows = await this.levels
      .find({
        game: game.slug,
        $or: [{ reportCount: { $gt: 0 } }, { hidden: true }],
      })
      .sort({ reportCount: -1, updatedAt: -1 })
      .select("+reports")
      .lean<ILeanLevel[]>();
    return rows.map((row) => ({
      ...this.toLevel(row),
      hidden: row.hidden,
      reports: row.reports.map((r) => ({
        userId: r.userId,
        reason: r.reason,
        at: r.at.toISOString(),
      })),
    }));
  }

  // Showing a level again clears its reports, so it is not hidden by the next one
  async moderate(game: IGameDefinition, levelId: string, hidden: boolean) {
    this.limitsOf(game);
    const update = hidden
      ? { hidden: true }
      : { hidden: false, reports: [], reportCount: 0 };
    const row = await this.levels
      .findOneAndUpdate(
        { _id: levelId, game: game.slug },
        { $set: update },
        { new: true }
      )
      .lean<ILeanLevel>();
    if (!row) throw new NotFoundException("There is no such level");
    return this.toLevel(row);
  }
}
