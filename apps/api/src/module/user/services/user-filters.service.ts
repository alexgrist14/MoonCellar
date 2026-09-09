import { ConflictException, Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";

@Injectable()
export class UserFiltersService {
  private readonly logger = new Logger(UserFiltersService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  async addFilter(userId: string, name: string, filter: string) {
    const user = await this.userModel
      .findOneAndUpdate(
        {
          _id: new mongoose.Types.ObjectId(userId),
          "filters.name": { $ne: name },
        },
        [
          {
            $set: {
              filters: {
                $concatArrays: [
                  "$filters",
                  [
                    {
                      $cond: {
                        if: {
                          $not: {
                            $in: [{ name, filter }, "$filters"],
                          },
                        },
                        then: { name, filter },
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
      .select("filters")
      .orFail();

    if (!user) {
      throw new ConflictException("Filter already Exists!");
    }

    return user;
  }

  async removeFilter(userId: string, name: string) {
    return this.userModel
      .findOneAndUpdate(
        { _id: new mongoose.Types.ObjectId(userId) },
        [
          {
            $set: {
              filters: {
                $filter: {
                  input: "$filters",
                  cond: { $ne: ["$$this.name", name] },
                },
              },
            },
          },
        ],
        { new: true }
      )
      .select("filters")
      .orFail();
  }

  async getFilters(userId: string) {
    return this.userModel
      .findOne({ _id: new mongoose.Types.ObjectId(userId) })
      .select("filters")
      .orFail();
  }
}
