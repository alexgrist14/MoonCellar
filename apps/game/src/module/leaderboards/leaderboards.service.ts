import {
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type {
  IGameAccount,
  IGameGhost,
  IGameLeaderboard,
  IGameLeaderboardEntry,
  IGameSubmitResult,
} from "@mooncellar/schemas";
import type { Model } from "mongoose";
import { checkRun, parseGhost } from "./ghost";
import { LeaderboardEntry } from "./schemas/leaderboard-entry.schema";

type ILeanEntry = LeaderboardEntry & { _id: { toString(): string } };

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectModel(LeaderboardEntry.name)
    private readonly entries: Model<LeaderboardEntry>
  ) {}

  private toEntry(row: ILeanEntry, rank: number): IGameLeaderboardEntry {
    return {
      entryId: row._id.toString(),
      rank,
      userId: row.userId,
      displayName: row.displayName,
      timeMs: row.timeMs,
      hasGhost: !!row.hasGhost,
      recordedAt: row.updatedAt.toISOString(),
    };
  }

  private async rankOf(row: ILeanEntry) {
    const ahead = await this.entries.countDocuments({
      level: row.level,
      $or: [
        { timeMs: { $lt: row.timeMs } },
        { timeMs: row.timeMs, updatedAt: { $lt: row.updatedAt } },
      ],
    });
    return ahead + 1;
  }

  async getLeaderboard(
    level: number,
    limit: number,
    offset: number
  ): Promise<IGameLeaderboard> {
    const [total, rows] = await Promise.all([
      this.entries.countDocuments({ level }),
      this.entries
        .find({ level })
        .sort({ timeMs: 1, updatedAt: 1 })
        .skip(offset)
        .limit(limit)
        .lean<ILeanEntry[]>(),
    ]);

    return {
      level,
      total,
      entries: rows.map((row, index) => this.toEntry(row, offset + index + 1)),
    };
  }

  async submit(
    level: number,
    account: IGameAccount,
    timeMs: number,
    ghost: string
  ): Promise<IGameSubmitResult> {
    const ghostData = Buffer.from(ghost, "base64");
    const run = parseGhost(ghostData);
    const rejection = typeof run === "string" ? run : checkRun(run, timeMs);
    if (rejection) {
      throw new UnprocessableEntityException(
        `${rejection}. The time was not recorded`
      );
    }
    const improved = await this.entries.findOneAndUpdate(
      {
        level,
        userId: account.id,
        timeMs: { $gt: timeMs },
      },
      {
        $set: {
          timeMs,
          displayName: account.userName,
          ghost: ghostData,
          hasGhost: true,
        },
      },
      { new: true }
    );

    if (!improved) {
      try {
        await this.entries.create({
          level,
          userId: account.id,
          displayName: account.userName,
          timeMs,
          ghost: ghostData,
          hasGhost: true,
        });
      } catch (error) {
        if ((error as { code?: number })?.code !== 11000) throw error;
        const current = await this.entries
          .findOneAndUpdate(
            { level, userId: account.id },
            { $set: { displayName: account.userName } },
            { new: true }
          )
          .lean<ILeanEntry>();
        return {
          improved: false,
          entry: this.toEntry(current!, await this.rankOf(current!)),
        };
      }
    }

    const saved = await this.entries
      .findOne({ level, userId: account.id })
      .lean<ILeanEntry>();
    return {
      improved: true,
      entry: this.toEntry(saved!, await this.rankOf(saved!)),
    };
  }

  async getGhost(entryId: string): Promise<IGameGhost> {
    const row = await this.entries.findById(entryId).select("+ghost");
    if (!row?.ghost?.length) {
      throw new NotFoundException("This entry has no recorded run");
    }
    return {
      entryId: row._id.toString(),
      level: row.level,
      userId: row.userId,
      displayName: row.displayName,
      timeMs: row.timeMs,
      ghost: Buffer.from(row.ghost).toString("base64"),
    };
  }
}
