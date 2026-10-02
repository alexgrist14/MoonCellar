import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { type FilterQuery, Model } from "mongoose";
import { User } from "../user/schemas/user.schema";
import { UserLogs } from "../user/schemas/user-logs.schema";
import {
  isEmptyLog,
  mergeLogChanges,
  pickLogChanges,
  toLogUpdate,
} from "../user/utils/user-logs.utils";
import { Game, type GameDocument } from "../games/schemas/game.schema";
import { AccountDeletionService } from "../user/services/account-deletion.service";
import { type ILogChanges, type IRole } from "@mooncellar/schemas";

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>,
    @InjectModel(Game.name) private Games: Model<GameDocument>,
    private readonly accountDeletion: AccountDeletionService
  ) {}

  async getAllUsers() {
    this.logger.log("Getting all users");
    try {
      return this.userModel
        .find()
        .select("-password -__v -logs -gamesRating")
        .exec();
    } catch (error) {
      this.logger.error(error, "Error getting all users");
      throw error;
    }
  }

  async getUserById(userId: string) {
    try {
      return this.userModel
        .findById(userId)
        .select("-password -__v -logs -gamesRating")
        .exec();
    } catch (error) {
      this.logger.error(error, `Error getting user ${userId}`);
      throw error;
    }
  }

  async addUserRole(userId: string, role: IRole) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(
          userId,
          { $addToSet: { roles: role } },
          { new: true }
        )
        .select("-password -__v")
        .exec();

      if (!user) {
        throw new NotFoundException("User not found");
      }

      return user;
    } catch (error) {
      this.logger.error(error, `Error adding user role ${userId} ${role}`);
      throw error;
    }
  }

  async removeUserRole(userId: string, role: IRole) {
    try {
      const user = await this.userModel
        .findByIdAndUpdate(userId, { $pull: { roles: role } }, { new: true })
        .select("-password -__v")
        .exec();

      if (!user) {
        throw new NotFoundException("User not found");
      }

      return user;
    } catch (error) {
      this.logger.error(error, `Error removing user role ${userId} ${role}`);
      throw error;
    }
  }

  async deleteUser(userId: string) {
    await this.accountDeletion.deleteAccount(userId);

    return { success: true, message: "User deleted successfully" };
  }

  async getGameById(gameId: string) {
    const game = await this.Games.findById(gameId).lean();

    if (!game) throw new NotFoundException(`Game not found: ${gameId}`);

    return game;
  }

  async mergeDuplicateGameLogs() {
    this.logger.log("Merging duplicate game logs");
    try {
      const duplicateGroups = await this.userLogsModel.aggregate<{
        _id: { userId: string; gameId: string };
        ids: string[];
      }>([
        {
          $group: {
            _id: { userId: "$userId", gameId: "$gameId" },
            count: { $sum: 1 },
            ids: { $push: "$_id" },
          },
        },
        { $match: { count: { $gt: 1 } } },
      ]);

      let mergedGroups = 0;
      let removedLogs = 0;

      for (const group of duplicateGroups) {
        const logs = await this.userLogsModel
          .find({ _id: { $in: group.ids } })
          .sort({ date: 1 })
          .lean()
          .exec();

        const [keep, ...duplicates] = logs;

        if (!duplicates.length) continue;

        const changes = logs.reduce<ILogChanges>(
          (merged, log) => mergeLogChanges(merged, pickLogChanges(log)),
          {}
        );
        const removed = isEmptyLog(changes) ? logs : duplicates;

        if (!isEmptyLog(changes)) {
          const { $set, $unset } = toLogUpdate(changes);

          await this.userLogsModel.updateOne(
            { _id: keep._id },
            { $set: { ...$set, date: logs[logs.length - 1].date }, $unset }
          );
        }

        await this.userLogsModel
          .deleteMany({ _id: { $in: removed.map((log) => log._id) } })
          .exec();

        mergedGroups += 1;
        removedLogs += duplicates.length;
      }

      this.logger.log(
        `Merged ${mergedGroups} duplicate game log groups, removed ${removedLogs} logs`
      );

      return { mergedGroups, removedLogs };
    } catch (error) {
      this.logger.error(error, "Error merging duplicate game logs");
      throw error;
    }
  }
}
