import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type IGetPlaythroughsRequest,
  type ILogPlaythroughState,
  type ISavePlaythroughRequest,
  type IUpdatePlaythroughRequest,
} from "@mooncellar/schemas";
import { UserLogsService } from "../../user/services/user-logs.service";
import { compact } from "../../user/utils/user-logs.utils";
import { Platform, type PlatformDocument } from "../schemas/platform.schema";
import {
  type IPlaythroughDocument,
  Playthrough,
} from "../schemas/playthroughs.schema";
import { sanitizeRichText } from "../../../shared/utils/rich-text.utils";
import { User } from "../../user/schemas/user.schema";

@Injectable()
export class PlaythroughsService {
  private readonly logger = new Logger(PlaythroughsService.name);
  constructor(
    @InjectModel(Playthrough.name)
    private GamesPlaythrouhgs: Model<IPlaythroughDocument>,
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>,
    private readonly logsService: UserLogsService,
    @InjectModel(User.name)
    private readonly users: Model<User>
  ) {}

  private async getLogState(
    play: IPlaythroughDocument
  ): Promise<ILogPlaythroughState> {
    const platform = play.platformId
      ? await this.Platforms.findById(play.platformId)
      : undefined;

    return compact({
      category: play.category,
      isMastered: !!play.isMastered,
      platformId: play.platformId?.toString(),
      platform: platform?.name,
      date: play.date || undefined,
      time: play.time || undefined,
      hasReview:
        !!play.isPublic && play.category !== "wishlist" && !!play.comment,
    });
  }

  async getPlaythroughs(data: IGetPlaythroughsRequest) {
    return await this.GamesPlaythrouhgs.find({
      ...data,
      userId: data.userId,
    } as FilterQuery<IPlaythroughDocument>);
  }

  async getPlaythroughsMinimal(data: IGetPlaythroughsRequest) {
    return await this.GamesPlaythrouhgs.find({
      ...data,
      userId: data.userId,
    } as FilterQuery<IPlaythroughDocument>).select(
      "_id category gameId isMastered updatedAt"
    );
  }

  async savePlaythrough(data: ISavePlaythroughRequest) {
    try {
      const play = await this.GamesPlaythrouhgs.create({
        ...data,
        comment: sanitizeRichText(data.comment),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Parameters<Model<IPlaythroughDocument>["create"]>[0]);

      await this.logsService.recordUserLog({
        userId: play.userId.toString(),
        gameId: play.gameId.toString(),
        playthrough: {
          playthroughId: play._id.toString(),
          action: "added",
          after: await this.getLogState(play),
        },
      });

      return play;
    } catch (err) {
      this.logger.error(
        err,
        `Failed to save playthrough: ${JSON.stringify(data)}`
      );
      throw err;
    }
  }

  async updatePlaythrough(
    id: mongoose.Types.ObjectId,
    data: IUpdatePlaythroughRequest
  ) {
    try {
      const previous = await this.GamesPlaythrouhgs.findById(id).orFail();
      const before = await this.getLogState(previous);

      const play = await this.GamesPlaythrouhgs.findOneAndUpdate(
        { _id: id },
        {
          ...data,
          comment: sanitizeRichText(data.comment),
          updatedAt: new Date().toISOString(),
        },
        {
          new: true,
        }
      );

      await this.logsService.recordUserLog({
        userId: play.userId.toString(),
        gameId: play.gameId.toString(),
        playthrough: {
          playthroughId: play._id.toString(),
          action: "updated",
          before,
          after: await this.getLogState(play),
        },
      });

      return play;
    } catch (err) {
      this.logger.error(err, `Failed to update playthrough: ${id}`);
      throw err;
    }
  }

  async deletePlaythrough(id: mongoose.Types.ObjectId) {
    try {
      const play = await this.GamesPlaythrouhgs.findOneAndDelete(
        { _id: id },
        {
          new: true,
        }
      );

      if (play?.raGameId != null) {
        await this.users.updateOne(
          { _id: play.userId },
          { $addToSet: { raIgnoredSets: play.raGameId } }
        );

        return play;
      }

      await this.logsService.recordUserLog({
        userId: play.userId.toString(),
        gameId: play.gameId.toString(),
        playthrough: {
          playthroughId: play._id.toString(),
          action: "removed",
          before: await this.getLogState(play),
        },
      });

      return play;
    } catch (err) {
      this.logger.error(err, `Failed to delete playthrough: ${id}`);
      throw err;
    }
  }
}
