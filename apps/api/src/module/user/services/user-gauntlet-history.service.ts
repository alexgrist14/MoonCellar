import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  GAUNTLET_HISTORY_LIMIT,
  type IGameResponse,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  STRIP_CHARACTERS_STAGE,
  TRIM_IGDB_STAGE,
} from "../../games/services/games.service";
import { setPagination } from "../../../shared/pagination";
import { GauntletHistory } from "../schemas/gauntlet-history.schema";

type IId = mongoose.Types.ObjectId;

@Injectable()
export class UserGauntletHistoryService {
  constructor(
    @InjectModel(GauntletHistory.name)
    private readonly history: Model<GauntletHistory>,
    @InjectModel(Game.name) private readonly games: Model<GameDocument>
  ) {}

  async getHistory(userId: IId, page: number, take: number) {
    const [result] = await this.history.aggregate<{
      total: { count: number }[];
      results: IGameResponse[];
    }>([
      { $match: { userId } },
      { $sort: { wonAt: -1, _id: -1 } },
      {
        $facet: {
          total: [{ $count: "count" }],
          results: [
            ...setPagination(page, take),
            {
              $lookup: {
                from: "games",
                localField: "gameId",
                foreignField: "_id",
                as: "game",
                pipeline: [TRIM_IGDB_STAGE, STRIP_CHARACTERS_STAGE],
              },
            },
            { $unwind: "$game" },
            { $replaceRoot: { newRoot: "$game" } },
          ],
        },
      },
    ]);

    return {
      total: result?.total[0]?.count ?? 0,
      results: result?.results ?? [],
    };
  }

  async getHistoryIds(userId: IId) {
    const ids = await this.history.distinct("gameId", { userId });

    return ids.map(String);
  }

  async addGames(userId: IId, gameIds: string[]) {
    const requested = [...new Set(gameIds)].map(
      (id) => new mongoose.Types.ObjectId(id)
    );
    const existing = new Set(
      (await this.games.distinct("_id", { _id: { $in: requested } })).map(
        String
      )
    );
    const now = Date.now();
    const writes = requested
      .filter((gameId) => existing.has(String(gameId)))
      .map((gameId, index) => ({
        updateOne: {
          filter: { userId, gameId },
          update: { $set: { wonAt: new Date(now - index) } },
          upsert: true,
        },
      }));

    if (!writes.length) return;

    await this.history.bulkWrite(writes, { ordered: false });

    const overflow = await this.history
      .find({ userId }, { _id: 1 })
      .sort({ wonAt: -1, _id: -1 })
      .skip(GAUNTLET_HISTORY_LIMIT)
      .lean();

    if (overflow.length) {
      await this.history.deleteMany({
        _id: { $in: overflow.map(({ _id }) => _id) },
      });
    }
  }

  async removeGame(userId: IId, gameId: string) {
    await this.history.deleteOne({
      userId,
      gameId: new mongoose.Types.ObjectId(gameId),
    });
  }

  async clear(userId: IId) {
    await this.history.deleteMany({ userId });
  }
}
