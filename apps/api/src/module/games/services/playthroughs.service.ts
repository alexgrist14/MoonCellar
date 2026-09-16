import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type IGetPlaythroughsRequest,
  type ISavePlaythroughRequest,
  type IUpdatePlaythroughRequest,
} from "@mooncellar/schemas";
import { UserLogsService } from "../../user/services/user-logs.service";
import { Platform, type PlatformDocument } from "../schemas/platform.schema";
import {
  type IPlaythroughDocument,
  Playthrough,
} from "../schemas/playthroughs.schema";
import { sanitizeRichText } from "../../../shared/utils/rich-text.utils";

const DETAIL_LABELS = ["Status", "Console", "Date", "Time"] as const;
const REMOVED_VALUE = "—";

type IPlaythroughMeta = Partial<Record<(typeof DETAIL_LABELS)[number], string>>;

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

  private async getPlaythroughMeta(
    play: IPlaythroughDocument
  ): Promise<IPlaythroughMeta> {
    const platform = !!play.platformId
      ? await this.Platforms.findById(play.platformId).orFail()
      : undefined;

    return {
      Status: play.isMastered ? "Mastered" : this.capitalize(play.category),
      Console: platform?.name,
      Date: !!play.date ? this.formatDate(play.date) : undefined,
      Time: !!play.time ? `${play.time}h` : undefined,
    };
  }

  private getFullDetails(meta: IPlaythroughMeta) {
    return DETAIL_LABELS.filter((label) => !!meta[label]).map(
      (label) => `${label}: ${meta[label]}`
    );
  }

  private getChangedDetails(
    previous: IPlaythroughMeta,
    next: IPlaythroughMeta
  ) {
    return DETAIL_LABELS.filter((label) => previous[label] !== next[label]).map(
      (label) => `${label}: ${next[label] ?? REMOVED_VALUE}`
    );
  }

  private renderDetails(details: string[]) {
    return details.length
      ? `<div style="font-size: 12px">${details.join("<br/>")}</div>`
      : "";
  }

  private buildLogText(header: string, details: string) {
    const boldHeader = `<b>${header}</b>`;

    return details ? `${boldHeader}${details}` : boldHeader;
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

      const meta = await this.getPlaythroughMeta(play);
      const text = this.buildLogText(
        "Added game to playthroughs",
        this.renderDetails(this.getFullDetails(meta))
      );

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
      const previous = await this.GamesPlaythrouhgs.findById(id).orFail();
      const previousMeta = await this.getPlaythroughMeta(previous);

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

      const meta = await this.getPlaythroughMeta(play);
      const text = this.buildLogText(
        "Updated playthrough",
        this.renderDetails(this.getChangedDetails(previousMeta, meta))
      );

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

      const meta = await this.getPlaythroughMeta(play);
      const text = this.buildLogText(
        "Removed playthrough",
        this.renderDetails(this.getFullDetails(meta))
      );

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
