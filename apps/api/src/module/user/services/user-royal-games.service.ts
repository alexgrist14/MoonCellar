import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type IRoyalGamesPosition,
  ROYAL_GAMES_LIMIT,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import { User } from "../schemas/user.schema";
import {
  buildAddRoyalGamesUpdate,
  buildRemoveRoyalGamesUpdate,
} from "../utils/royal-games.utils";

export type IRoyalGamesChange = { royalGames: string[]; rejected: string[] };

const RETURN_ROYAL_GAMES = { new: true, projection: { royalGames: 1 } };

const toIds = (royalGames?: mongoose.Types.ObjectId[] | null) =>
  (royalGames ?? []).map(String);

const normalizeIds = (gameIds: string[]) => [
  ...new Set(gameIds.map((gameId) => gameId.toLowerCase())),
];

const toObjectIds = (gameIds: string[]) =>
  gameIds.map((gameId) => new mongoose.Types.ObjectId(gameId));

const toChange = (
  royalGames: mongoose.Types.ObjectId[] | null | undefined,
  requested: string[]
): IRoyalGamesChange => {
  const list = toIds(royalGames);
  const inList = new Set(list);

  return {
    royalGames: list,
    rejected: requested.filter((gameId) => !inList.has(gameId)),
  };
};

@Injectable()
export class UserRoyalGamesService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Game.name) private gameModel: Model<GameDocument>
  ) {}

  async hasUser(userId: string) {
    return !!(await this.userModel.exists({ _id: userId }));
  }

  async getRoyalGames(userId: string) {
    const user = await this.userModel
      .findById(userId, { royalGames: 1 })
      .lean();

    return toIds(user?.royalGames);
  }

  async addRoyalGames(
    userId: string,
    gameIds: string[],
    position: IRoyalGamesPosition
  ): Promise<IRoyalGamesChange> {
    const requested = normalizeIds(gameIds);
    const games = await this.findExistingGames(requested);
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        buildAddRoyalGamesUpdate(games, position, ROYAL_GAMES_LIMIT),
        RETURN_ROYAL_GAMES
      )
      .lean();

    return toChange(user?.royalGames, requested);
  }

  async removeRoyalGames(
    userId: string,
    gameIds: string[]
  ): Promise<IRoyalGamesChange> {
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        buildRemoveRoyalGamesUpdate(toObjectIds(normalizeIds(gameIds))),
        RETURN_ROYAL_GAMES
      )
      .lean();

    return { royalGames: toIds(user?.royalGames), rejected: [] };
  }

  async setRoyalGames(
    userId: string,
    gameIds: string[]
  ): Promise<IRoyalGamesChange> {
    const requested = normalizeIds(gameIds);
    const games = await this.findExistingGames(requested);
    const user = await this.userModel
      .findByIdAndUpdate(
        userId,
        { $set: { royalGames: games } },
        RETURN_ROYAL_GAMES
      )
      .lean();

    return toChange(user?.royalGames, requested);
  }

  private async findExistingGames(gameIds: string[]) {
    if (!gameIds.length) return [];

    const games = await this.gameModel
      .find(
        { _id: { $in: toObjectIds(gameIds) } } as FilterQuery<GameDocument>,
        { _id: 1 }
      )
      .lean();
    const found = new Set(games.map((game) => String(game._id)));

    return toObjectIds(gameIds.filter((gameId) => found.has(gameId)));
  }
}
