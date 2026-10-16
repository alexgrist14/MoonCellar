import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { IGameLeaderboard } from "@mooncellar/schemas";
import type { Model } from "mongoose";
import { LeaderboardEntry } from "./schemas/leaderboard-entry.schema";

@Injectable()
export class LeaderboardsService {
  constructor(
    @InjectModel(LeaderboardEntry.name)
    private readonly entries: Model<LeaderboardEntry>
  ) {}

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
        .lean(),
    ]);

    return {
      level,
      total,
      entries: rows.map((row, index) => ({
        rank: offset + index + 1,
        userId: row.userId,
        displayName: row.displayName,
        timeMs: row.timeMs,
        recordedAt: row.updatedAt.toISOString(),
      })),
    };
  }
}
