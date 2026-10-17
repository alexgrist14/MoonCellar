import {
  Injectable,
  Logger,
  NotFoundException,
  type OnModuleInit,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  IGameAccount,
  IGameLeaderboard,
  IGameLeaderboardEntry,
  IGameReplay,
  IGameSubmitResult,
} from "@mooncellar/schemas";
import type { Model, SortOrder } from "mongoose";
import type { IGameDefinition } from "../../games/game-definition";
import { LeaderboardEntry } from "./schemas/leaderboard-entry.schema";

type ILeanEntry = LeaderboardEntry & { _id: { toString(): string } };

const ACCEPTED_REPLAYS = 20;

@Injectable()
export class LeaderboardsService implements OnModuleInit {
  private readonly logger = new Logger(LeaderboardsService.name);

  constructor(
    @InjectModel(LeaderboardEntry.name)
    private readonly entries: Model<LeaderboardEntry>
  ) {}

  async onModuleInit() {
    const result = await this.entries.collection.updateMany(
      { level: { $exists: true } },
      [
        {
          $set: {
            game: "rooftops",
            board: {
              $concat: ["level-", { $toString: { $add: ["$level", 1] } }],
            },
            score: "$timeMs",
            replay: "$ghost",
            hasReplay: { $ifNull: ["$hasGhost", false] },
          },
        },
        { $unset: ["level", "timeMs", "ghost", "hasGhost"] },
      ]
    );
    if (result.modifiedCount) {
      this.logger.log(
        `Moved ${result.modifiedCount} leaderboard entries to game boards`
      );
    }
    await this.entries.syncIndexes();
  }

  private sortOf(game: IGameDefinition): Record<string, SortOrder> {
    return { score: game.scoreOrder === "asc" ? 1 : -1, updatedAt: 1 };
  }

  private toEntry(row: ILeanEntry, rank: number): IGameLeaderboardEntry {
    return {
      entryId: row._id.toString(),
      rank,
      userId: row.userId,
      displayName: row.displayName,
      score: row.score,
      hasReplay: !!row.hasReplay,
      recordedAt: row.updatedAt.toISOString(),
    };
  }

  private async rankOf(game: IGameDefinition, row: ILeanEntry) {
    const better = game.scoreOrder === "asc" ? "$lt" : "$gt";
    const ahead = await this.entries.countDocuments({
      game: row.game,
      board: row.board,
      $or: [
        { score: { [better]: row.score } },
        { score: row.score, updatedAt: { $lt: row.updatedAt } },
      ],
    });
    return ahead + 1;
  }

  async getLeaderboard(
    game: IGameDefinition,
    board: string,
    limit: number,
    offset: number
  ): Promise<IGameLeaderboard> {
    const filter = { game: game.slug, board };
    const [total, rows] = await Promise.all([
      this.entries.countDocuments(filter),
      this.entries
        .find(filter)
        .sort(this.sortOf(game))
        .skip(offset)
        .limit(limit)
        .lean<ILeanEntry[]>(),
    ]);
    return {
      game: game.slug,
      board,
      total,
      entries: rows.map((row, index) => this.toEntry(row, offset + index + 1)),
    };
  }

  private async acceptedReplays(game: IGameDefinition, board: string) {
    const rows = await this.entries
      .find({ game: game.slug, board, hasReplay: true })
      .sort(this.sortOf(game))
      .limit(ACCEPTED_REPLAYS)
      .select("+replay");
    return rows.flatMap((row) => (row.replay ? [Buffer.from(row.replay)] : []));
  }

  async checkReplay(
    game: IGameDefinition,
    board: string,
    score: number,
    replay: Buffer | null
  ): Promise<string | null> {
    if (!replay) {
      return game.replay.required
        ? `${game.name} records a score only with its replay`
        : null;
    }
    if (replay.length > game.replay.maxBytes) return "The replay is too large";
    if (!game.replay.check) return null;
    return game.replay.check(
      replay,
      score,
      await this.acceptedReplays(game, board)
    );
  }

  async submit(
    game: IGameDefinition,
    board: string,
    account: IGameAccount,
    score: number,
    replayBase64?: string
  ): Promise<IGameSubmitResult> {
    const replay = replayBase64 ? Buffer.from(replayBase64, "base64") : null;
    const rejection = await this.checkReplay(game, board, score, replay);
    if (rejection) {
      throw new UnprocessableEntityException(
        `${rejection}. The score was not recorded`
      );
    }
    const key = { game: game.slug, board, userId: account.id };
    const worse = game.scoreOrder === "asc" ? "$gt" : "$lt";
    const update = {
      score,
      displayName: account.userName,
      replay,
      hasReplay: !!replay,
    };
    const improved = await this.entries.findOneAndUpdate(
      { ...key, score: { [worse]: score } },
      { $set: update },
      { new: true }
    );
    if (!improved) {
      try {
        await this.entries.create({ ...key, ...update });
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000) throw error;
        const current = await this.entries
          .findOneAndUpdate(
            key,
            { $set: { displayName: account.userName } },
            { new: true }
          )
          .lean<ILeanEntry>();
        return {
          improved: false,
          entry: this.toEntry(current!, await this.rankOf(game, current!)),
        };
      }
    }
    const saved = await this.entries.findOne(key).lean<ILeanEntry>();
    return {
      improved: true,
      entry: this.toEntry(saved!, await this.rankOf(game, saved!)),
    };
  }

  async getReplay(
    game: IGameDefinition,
    entryId: string
  ): Promise<IGameReplay> {
    const row = await this.entries
      .findOne({ _id: entryId, game: game.slug })
      .select("+replay");
    if (!row?.replay?.length) {
      throw new NotFoundException("This entry has no replay");
    }
    return {
      entryId: row._id.toString(),
      game: row.game,
      board: row.board,
      userId: row.userId,
      displayName: row.displayName,
      score: row.score,
      replay: Buffer.from(row.replay).toString("base64"),
    };
  }
}
