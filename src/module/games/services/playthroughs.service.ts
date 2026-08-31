import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { FilterQuery, Model } from "mongoose";
import {
  IGetPlaythroughsRequest,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "src/shared/zod/schemas/playthroughs.schema";
import { UserLogsService } from "src/module/user/services/user-logs.service";
import { Platform, PlatformDocument } from "../schemas/platform.schema";
import {
  IPlaythroughDocument,
  Playthrough,
} from "../schemas/playthroughs.schema";

@Injectable()
export class PlaythroughsService {
  private readonly logger = new Logger(PlaythroughsService.name);
  constructor(
    @InjectModel(Playthrough.name)
    private GamesPlaythrouhgs: Model<IPlaythroughDocument>,
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>,
    private readonly logsService: UserLogsService
  ) {}

  private capitalize(value: string) {
    return value.charAt(0).toUpperCase() + value.slice(1);
  }

  private formatDate(date: string) {
    const [year, month, day] = date.split("-");
    return `${day}.${month}.${year}`;
  }

  private async getPlaythroughDetailsText(play: IPlaythroughDocument) {
    const platform = !!play.platformId
      ? await this.Platforms.findById(play.platformId).orFail()
      : undefined;

    const status = play.isMastered
      ? "Mastered"
      : this.capitalize(play.category);

    const details = [
      `Status: ${status}`,
      !!platform && `Console: ${platform.name}`,
      !!play.date && `Date: ${this.formatDate(play.date)}`,
      !!play.time && `Time: ${play.time}h`,
      !!play.comment && `Comment: ${play.comment}`,
    ].filter(Boolean);

    return {
      platform,
      details: details.length
        ? `<span style="font-size: 12px">${details.join("<br/>")}</span>`
        : "",
    };
  }

  private buildLogText(header: string, details: string) {
    const boldHeader = `<b>${header}</b>`;

    return details ? `${boldHeader}<br/>${details}` : boldHeader;
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
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      } as Parameters<Model<IPlaythroughDocument>["create"]>[0]);

      const { details } = await this.getPlaythroughDetailsText(play);
      const text = this.buildLogText("Added game to playthroughs", details);

      await this.logsService.createUserLog({
        userId: play.userId.toString(),
        type: "list",
        text,
        gameId: play.gameId.toString(),
        segment: "added",
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
      const play = await this.GamesPlaythrouhgs.findOneAndUpdate(
        { _id: id },
        { ...data, updatedAt: new Date().toISOString() },
        {
          new: true,
        }
      );

      const { details } = await this.getPlaythroughDetailsText(play);
      const text = this.buildLogText("Updated playthrough", details);

      await this.logsService.createUserLog({
        userId: play.userId.toString(),
        type: "list",
        text,
        gameId: play.gameId.toString(),
        segment: "updated",
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

      const { details } = await this.getPlaythroughDetailsText(play);
      const text = this.buildLogText("Removed playthrough", details);

      await this.logsService.createUserLog({
        userId: play.userId.toString(),
        type: "list",
        text,
        gameId: play.gameId.toString(),
        segment: "removed",
      });

      return play;
    } catch (err) {
      this.logger.error(err, `Failed to delete playthrough: ${id}`);
      throw err;
    }
  }
}
