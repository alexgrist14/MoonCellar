import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Platform, PlatformDocument } from "../schemas/platform.schema";

@Injectable()
export class PlatformsService {
  private readonly logger = new Logger(PlatformsService.name);
  constructor(
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>
  ) {}

  async getPlatforms() {
    try {
      return await this.Platforms.find();
    } catch (err) {
      this.logger.error(err, `Failed to get platforms`);
      throw err;
    }
  }
}
