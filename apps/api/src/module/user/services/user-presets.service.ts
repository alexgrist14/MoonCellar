import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";

@Injectable()
export class UserPresetsService {
  private readonly logger = new Logger(UserPresetsService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async addPreset(userId: string, name: string, preset: string) {
    try {
      const user = await this.userModel
        .findOneAndUpdate(
          {
            _id: new mongoose.Types.ObjectId(userId),
            "presets.name": { $ne: name },
          },
          [
            {
              $set: {
                presets: {
                  $concatArrays: [
                    "$presets",
                    [
                      {
                        $cond: {
                          if: {
                            $not: {
                              $in: [{ name, preset }, "$presets"],
                            },
                          },
                          then: { name, preset },
                          else: "$$REMOVE",
                        },
                      },
                    ],
                  ],
                },
              },
            },
          ],
          { new: true }
        )
        .select("presets")
        .orFail();

      if (!user) {
        throw new ConflictException("Preset already Exists!");
      }

      return user;
    } catch (err) {
      this.logger.error(err, `Failed to add preset: ${userId}`);
      throw err;
    }
  }

  async removePreset(userId: string, name: string) {
    try {
      return this.userModel
        .findOneAndUpdate(
          { _id: new mongoose.Types.ObjectId(userId) },
          [
            {
              $set: {
                presets: {
                  $filter: {
                    input: "$presets",
                    cond: { $ne: ["$$this.name", name] },
                  },
                },
              },
            },
          ],
          { new: true }
        )
        .select("presets");
    } catch (err) {
      this.logger.error(err, `Failed to remove preset: ${userId}`);
      throw err;
    }
  }

  async getPresets(userId: string) {
    try {
      return this.userModel
        .findOne({ _id: new mongoose.Types.ObjectId(userId) })
        .select("presets");
    } catch (err) {
      this.logger.error(err, `Failed to get presets: ${userId}`);
      throw err;
    }
  }
}
