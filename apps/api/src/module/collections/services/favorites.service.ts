import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type Model } from "mongoose";
import { FAVORITES_MAX } from "@mooncellar/schemas";
import type {
  IAddFavoriteRequest,
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
        await this.logFavoriteAdded(userId, gameId);
      }

      for (const gameId of previous.filter((id) => !next.includes(id))) {
        await this.logFavoriteRemoved(userId, gameId);
      }

      return { favorites: next };
    } catch (err) {
      this.logger.error(err, `Failed to update favourites: ${userId}`);
      throw err;
    }
  }

  async addFavorite(
    userId: string,
    gameId: string,
    { replaceGameId }: IAddFavoriteRequest
  ): Promise<IUpdateFavoritesResponse> {
    const ownerId = toObjectId(userId, "user id");
    const id = toObjectId(gameId, "game id");
    const replaceId = replaceGameId
      ? toObjectId(replaceGameId, "game id")
      : undefined;

    if (!(await this.gameModel.exists({ _id: id }))) {
      throw new BadRequestException("Game does not exist");
    }

    try {
      const updated = await (replaceId
        ? this.userModel.findOneAndUpdate(
            { _id: ownerId, favorites: { $all: [replaceId], $ne: id } },
            { $set: { "favorites.$[old]": id } },
            { new: true, arrayFilters: [{ old: replaceId }] }
          )
        : this.userModel.findOneAndUpdate(
            {
              _id: ownerId,
              favorites: { $ne: id },
              [`favorites.${FAVORITES_MAX - 1}`]: { $exists: false },
            },
            { $push: { favorites: id } },
            { new: true }
          )
      )
        .select("favorites")
        .lean<{ favorites: mongoose.Types.ObjectId[] }>();

      if (!updated) {
        const { favorites } = await this.getFavoriteIds(userId);

        if (favorites.includes(gameId)) return { favorites };

        throw new BadRequestException(
          replaceGameId
            ? "The game to replace is not in favourites"
            : `Favourites are limited to ${FAVORITES_MAX} games`
        );
      }

      await this.logFavoriteAdded(userId, gameId);

      if (replaceGameId) await this.logFavoriteRemoved(userId, replaceGameId);

      return { favorites: updated.favorites.map((item) => item.toString()) };
    } catch (err) {
      this.logger.error(err, `Failed to add favourite: ${userId}`);
      throw err;
    }
  }

  async removeFavorite(
    userId: string,
    gameId: string
  ): Promise<IUpdateFavoritesResponse> {
    const id = toObjectId(gameId, "game id");

    try {
      const updated = await this.userModel
        .findOneAndUpdate(
          { _id: toObjectId(userId, "user id"), favorites: id },
          { $pull: { favorites: id } },
          { new: true }
        )
        .select("favorites")
        .lean<{ favorites: mongoose.Types.ObjectId[] }>();

      if (!updated) return this.getFavoriteIds(userId);

      await this.logFavoriteRemoved(userId, gameId);

      return { favorites: updated.favorites.map((item) => item.toString()) };
    } catch (err) {
      this.logger.error(err, `Failed to remove favourite: ${userId}`);
      throw err;
    }
  }

  private logFavoriteAdded(userId: string, gameId: string) {
    return this.logsService.createUserLog({
      userId,
      gameId,
      type: "custom",
      segment: "favorite",
      text: "<b>Added to favourites</b>",
    });
  }

  private logFavoriteRemoved(userId: string, gameId: string) {
    return this.logsService.removeUserLogSegment({
      userId,
      gameId,
      segment: "favorite",
      fallbackType: "custom",
      fallbackText: "<b>Removed from favourites</b>",
    });
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

  async addFavoriteCharacter(
    userId: string,
    characterId: string
  ): Promise<IUpdateFavoriteCharactersResponse> {
    const id = toObjectId(characterId, "character id");

    if (!(await this.characterModel.exists({ _id: id }))) {
      throw new BadRequestException("Character does not exist");
    }

    return this.changeFavoriteCharacters(userId, {
      $addToSet: { favoriteCharacters: id },
    });
  }

  async removeFavoriteCharacter(
    userId: string,
    characterId: string
  ): Promise<IUpdateFavoriteCharactersResponse> {
    return this.changeFavoriteCharacters(userId, {
      $pull: { favoriteCharacters: toObjectId(characterId, "character id") },
    });
  }

  private async changeFavoriteCharacters(
    userId: string,
    update: mongoose.UpdateQuery<User>
  ): Promise<IUpdateFavoriteCharactersResponse> {
    try {
      const updated = await this.userModel
        .findByIdAndUpdate(toObjectId(userId, "user id"), update, {
          new: true,
        })
        .select("favoriteCharacters")
        .lean<{ favoriteCharacters?: mongoose.Types.ObjectId[] }>();

      if (!updated) throw new NotFoundException("User not found");

      return {
        favoriteCharacters: (updated.favoriteCharacters ?? []).map((id) =>
          id.toString()
        ),
      };
    } catch (err) {
      this.logger.error(
        err,
        `Failed to change favourite characters: ${userId}`
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
