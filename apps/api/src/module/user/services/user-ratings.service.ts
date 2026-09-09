import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import {
  IAddUserRatingRequest,
  IGetUserRatingsRequest,
  IRemoveUserRatingRequest,
  IUpdateUserRatingRequest,
} from "src/shared/zod/schemas/user-ratings.schema";
import { Rating } from "../schemas/user-ratings.schema";
import { UserLogsService } from "./user-logs.service";
import { Game, GameDocument } from "../../games/schemas/game.schema";

@Injectable()
export class UserRatingsService {
  private readonly logger = new Logger(UserRatingsService.name);
  constructor(
    @InjectModel(Rating.name)
    private userRatings: Model<Rating>,
    @InjectModel(Game.name)
    private games: Model<GameDocument>,
    private readonly logsService: UserLogsService
  ) {}

  private async recalculateAverageRating(
    gameId: mongoose.Types.ObjectId
  ): Promise<void> {
    const [result] = await this.userRatings.aggregate([
      { $match: { gameId } },
      {
        $group: {
          _id: "$gameId",
          averageRating: { $avg: "$rating" },
          ratingsCount: { $sum: 1 },
        },
      },
    ]);

    await this.games.updateOne(
      { _id: gameId },
      {
        $set: {
          averageRating: result?.averageRating ?? null,
          ratingsCount: result?.ratingsCount ?? 0,
        },
      }
    );
  }

  async addRating({ rating, userId, gameId }: IAddUserRatingRequest) {
    try {
      const userRating = await this.userRatings.create({
        rating,
        userId: new mongoose.Types.ObjectId(userId),
        gameId: new mongoose.Types.ObjectId(gameId),
      });
      if (userRating) {
        await this.logsService.createUserLog({
          userId,
          type: "rating",
          text: `Set rating ${rating}`,
          gameId,
          segment: "rating",
        });

        await this.recalculateAverageRating(userRating.gameId);
      }

      return userRating;
    } catch (err) {
      this.logger.error(err, `Failed to add rating: ${userId}`);
      throw err;
    }
  }

  async updateRating({ rating, _id, userId }: IUpdateUserRatingRequest) {
    try {
      const userRating = await this.userRatings.findOneAndUpdate(
        { _id },
        { rating },
        { new: true }
      );
      if (userRating) {
        await this.logsService.createUserLog({
          userId,
          type: "rating",
          text: `Updated rating to ${rating}`,
          gameId: userRating.gameId.toString(),
          segment: "rating",
        });

        await this.recalculateAverageRating(userRating.gameId);
      }
      return userRating;
    } catch (err) {
      this.logger.error(err, `Failed to update rating: ${userId}`);
      throw err;
    }
  }

  async removeRating({ _id }: IRemoveUserRatingRequest) {
    try {
      const userRating = await this.userRatings.findOneAndDelete({ _id });

      if (userRating) {
        await this.logsService.removeUserLogSegment({
          userId: userRating.userId.toString(),
          gameId: userRating.gameId.toString(),
          segment: "rating",
          fallbackType: "rating",
          fallbackText: "Removed rating",
        });

        await this.recalculateAverageRating(userRating.gameId);
      }

      return userRating;
    } catch (err) {
      this.logger.error(err, `Failed to remove rating: ${_id}`);
      throw err;
    }
  }

  async getRatings({ userId }: IGetUserRatingsRequest) {
    try {
      return this.userRatings.find({
        userId: new mongoose.Types.ObjectId(userId),
      });
    } catch (err) {
      this.logger.error(err, `Failed to get ratings: ${userId}`);
      throw err;
    }
  }

  async recalculateAllAverageRatings() {
    try {
      const averages = await this.userRatings.aggregate([
        {
          $group: {
            _id: "$gameId",
            averageRating: { $avg: "$rating" },
            ratingsCount: { $sum: 1 },
          },
        },
      ]);

      await this.games.updateMany(
        { averageRating: { $ne: null } },
        { $set: { averageRating: null, ratingsCount: 0 } }
      );

      if (averages.length) {
        await this.games.bulkWrite(
          averages.map(({ _id, averageRating, ratingsCount }) => ({
            updateOne: {
              filter: { _id },
              update: { $set: { averageRating, ratingsCount } },
            },
          }))
        );
      }

      this.logger.log(
        `Recalculated average rating for ${averages.length} games`
      );

      return { recalculatedGames: averages.length };
    } catch (err) {
      this.logger.error(err, "Failed to recalculate average ratings");
      throw err;
    }
  }
}
