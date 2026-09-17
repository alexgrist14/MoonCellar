import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type Model } from "mongoose";
import type {
  IUpdateFavoritesRequest,
  IUpdateFavoritesResponse,
} from "@mooncellar/schemas";
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
}
