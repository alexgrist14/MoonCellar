import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { setPagination } from "../../../shared/pagination";
import {
  type IGetUserLogsRequest,
  type ILog,
  type ILogChanges,
  type IRemoveUserLogRequest,
} from "@mooncellar/schemas";
import { UserLogs } from "../schemas/user-logs.schema";
import { User } from "../schemas/user.schema";
import { Game } from "../../games/schemas/game.schema";
import { NotificationsService } from "../../notifications/services/notifications.service";
import {
  canMergeLog,
  getFollowingActivity,
  isEmptyLog,
  isSameLogValue,
  mergeLogChanges,
  pickLogChanges,
  toLogUpdate,
} from "../utils/user-logs.utils";

export interface IRecordUserLogParams extends ILogChanges {
  userId: string;
  gameId: string;
}

type ILogDocument = ILogChanges & {
  _id: mongoose.Types.ObjectId;
  gameId?: mongoose.Types.ObjectId;
  __v?: number;
};

const MAX_WRITE_ATTEMPTS = 3;

@Injectable()
export class UserLogsService {
  private readonly logger = new Logger(UserLogsService.name);
  constructor(
    @InjectModel(UserLogs.name) private userLogsModel: Model<UserLogs>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectModel(Game.name) private gameModel: Model<Game>,
    private readonly notifications: NotificationsService
  ) {}

  async recordUserLog({ userId, gameId, ...change }: IRecordUserLogParams) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const gameObjectId = new mongoose.Types.ObjectId(gameId);

      for (let attempt = 0; attempt < MAX_WRITE_ATTEMPTS; attempt++) {
        const lastLog = await this.userLogsModel
          .findOne({ userId: userObjectId })
          .sort({ date: -1 })
          .lean<ILogDocument>();
        const current = lastLog && pickLogChanges(lastLog);

        if (
          !current ||
          lastLog.gameId?.toString() !== gameId ||
          !canMergeLog(current, change)
        ) {
          const changes = mergeLogChanges({}, change);

          if (isEmptyLog(changes)) return;

          const log = await this.userLogsModel.create({
            ...changes,
            date: new Date(),
            gameId: gameObjectId,
            userId: userObjectId,
          });

          void this.notifyFollowers(userId, gameId, change);
          return log;
        }

        const changes = mergeLogChanges(current, change);

        if (isSameLogValue(changes, current)) return;

        const filter = {
          _id: lastLog._id,
          __v: lastLog.__v ?? { $exists: false },
        };

        if (isEmptyLog(changes)) {
          const { deletedCount } = await this.userLogsModel.deleteOne(filter);

          if (deletedCount) return;
          continue;
        }

        const { $set, $unset } = toLogUpdate(changes);
        const { matchedCount } = await this.userLogsModel.updateOne(filter, {
          $set: { ...$set, date: new Date() },
          $unset,
          $inc: { __v: 1 },
        });

        if (matchedCount) {
          void this.notifyFollowers(userId, gameId, change);
          return;
        }
      }

      this.logger.warn(
        `User log for ${userId}/${gameId} kept changing, dropped the change`
      );
    } catch (err) {
      this.logger.error(err, `Failed to record user log: ${userId}`);
      throw err;
    }
  }

  private async notifyFollowers(
    userId: string,
    gameId: string,
    change: ILogChanges
  ) {
    const activity = getFollowingActivity(change);

    if (!activity) return;

    try {
      const [user, game] = await Promise.all([
        this.userModel.findById(userId).select("followers").lean(),
        this.gameModel.findById(gameId).select("slug name").lean(),
      ]);

      if (!user?.followers?.length || !game) return;

      for (const followerId of user.followers) {
        void this.notifications.notify({
          userId: followerId,
          actorId: userId,
          type: "following-activity",
          subjectId: userId,
          payload: { ...activity, gameSlug: game.slug, gameName: game.name },
        });
      }
    } catch (err) {
      this.logger.error(err, `Failed to notify followers of ${userId}`);
    }
  }

  async removeUserLog({ _id, userId }: IRemoveUserLogRequest) {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      return await this.userLogsModel.deleteOne({
        _id,
        userId: userObjectId,
      });
    } catch (err) {
      this.logger.error(err, `Failed to remove user log: ${_id}`);
      throw err;
    }
  }

  async getUserLogs(
    userId: string,
    { take = 30, page = 1 }: IGetUserLogsRequest
  ): Promise<{ results: ILog[]; total: number }> {
    try {
      const userObjectId = new mongoose.Types.ObjectId(userId);
      const pagination = setPagination(page, take);

      const [results, total] = await Promise.all([
        this.userLogsModel.aggregate<ILog>([
          { $match: { userId: userObjectId } },
          { $sort: { date: -1 } },
          ...pagination,
        ]),
        this.userLogsModel.countDocuments({ userId: userObjectId }),
      ]);

      return { results, total };
    } catch (err) {
      this.logger.error(err, `Failed to get user logs: ${userId}`);
      throw err;
    }
  }
}
