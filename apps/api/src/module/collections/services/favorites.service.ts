import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type Model } from "mongoose";
import type {
  IUpdateFavoriteCharactersRequest,
  IUpdateFavoriteCharactersResponse,
  IUpdateFavoritesRequest,
  IUpdateFavoritesResponse,
} from "@mooncellar/schemas";
import { Character } from "../../games/schemas/character.schema";
import { Game } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";
import { UserLogsService } from "../../user/services/user-logs.service";
import { toObjectId } from "../utils/collections.utils";

@Injectable()
export class FavoritesService {
  private readonly logger = new Logger(FavoritesService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(Character.name)
    private readonly characterModel: Model<Character>,
    private readonly logsService: UserLogsService
  ) {}

  async updateFavorites(
    userId: string,
    { gameIds }: IUpdateFavoritesRequest
  ): Promise<IUpdateFavoritesResponse> {
    const ownerId = toObjectId(userId, "user id");
    const user = await this.userModel.findById(ownerId).select("favorites");

    if (!user) throw new NotFoundException("User not found");

    const ids = gameIds.map((id) => toObjectId(id, "game id"));
    const found = await this.gameModel.countDocuments({ _id: { $in: ids } });

    if (found !== ids.length) {
      throw new BadRequestException("One of the games does not exist");
    }

    const previous = (user.favorites ?? []).map((id) => id.toString());
    const next = ids.map((id) => id.toString());

    try {
      await this.userModel.updateOne(
        { _id: ownerId },
        { $set: { favorites: ids } }
      );

      for (const gameId of next.filter((id) => !previous.includes(id))) {
        await this.logsService.createUserLog({
          userId,
          gameId,
          type: "custom",
          segment: "favorite",
          text: "<b>Added to favourites</b>",
        });
      }

      for (const gameId of previous.filter((id) => !next.includes(id))) {
        await this.logsService.removeUserLogSegment({
          userId,
          gameId,
          segment: "favorite",
          fallbackType: "custom",
          fallbackText: "<b>Removed from favourites</b>",
        });
      }

      return { favorites: next };
    } catch (err) {
      this.logger.error(err, `Failed to update favourites: ${userId}`);
      throw err;
    }
  }

  async getFavoriteIds(userId: string): Promise<IUpdateFavoritesResponse> {
    const user = await this.userModel
      .findById(toObjectId(userId, "user id"))
      .select("favorites")
      .lean<{ favorites?: mongoose.Types.ObjectId[] }>();

    if (!user) throw new NotFoundException("User not found");

    return { favorites: (user.favorites ?? []).map((id) => id.toString()) };
  }

  async updateFavoriteCharacters(
    userId: string,
    { characterIds }: IUpdateFavoriteCharactersRequest
  ): Promise<IUpdateFavoriteCharactersResponse> {
    const ownerId = toObjectId(userId, "user id");
    const ids = characterIds.map((id) => toObjectId(id, "character id"));
    const found = await this.characterModel.countDocuments({
      _id: { $in: ids },
    });

    if (found !== ids.length) {
      throw new BadRequestException("One of the characters does not exist");
    }

    try {
      const { matchedCount } = await this.userModel.updateOne(
        { _id: ownerId },
        { $set: { favoriteCharacters: ids } }
      );

      if (!matchedCount) throw new NotFoundException("User not found");

      return { favoriteCharacters: characterIds };
    } catch (err) {
      this.logger.error(
        err,
        `Failed to update favourite characters: ${userId}`
      );
      throw err;
    }
  }

  async getFavoriteCharacters(userId: string) {
    const user = await this.userModel
      .findById(toObjectId(userId, "user id"))
      .select("favoriteCharacters")
      .lean<{ favoriteCharacters?: mongoose.Types.ObjectId[] }>();

    if (!user) throw new NotFoundException("User not found");

    const ids = user.favoriteCharacters ?? [];

    if (!ids.length) return [];

    const characters = await this.characterModel
      .find({ _id: { $in: ids } })
      .select("-igdb -vndb -gameIds -__v")
      .lean();

    const byId = new Map(
      characters.map((character) => [character._id.toString(), character])
    );

    return ids.flatMap((id) => byId.get(id.toString()) ?? []);
  }
}
