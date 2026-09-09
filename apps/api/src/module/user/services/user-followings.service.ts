import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model } from "mongoose";
import { User } from "src/module/user/schemas/user.schema";
import { followListLookup } from "src/shared/utils";

@Injectable()
export class UserFollowingsService {
  private readonly logger = new Logger(UserFollowingsService.name);
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}
  async addUserFollowing(userId: string, followingId: string) {
    const user = await this.userModel.findById(userId);
    const followingUser = await this.userModel.findById(followingId);
    if (!user || !followingUser) throw new NotFoundException("User not found");
    if (user.followings.includes(new mongoose.Types.ObjectId(followingId)))
      throw new ConflictException(`User already in following list`);
    try {
      user.followings.push(new mongoose.Types.ObjectId(followingId));
      followingUser.followers.push(new mongoose.Types.ObjectId(userId));
      await Promise.all([user.save(), followingUser.save()]);
      return (
        await this.userModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(userId) },
          },
          ...followListLookup("followings"),
        ])
      ).pop();
    } catch (err) {
      this.logger.error(err, `Failed to add user following: ${userId}`);
      throw err;
    }
  }

  async removeUserFollowing(userId: string, followingId: string) {
    const user = await this.userModel.findById(userId);
    const followingUser = await this.userModel.findById(followingId);
    if (!user || !followingUser) throw new NotFoundException("User not found");
    try {
      user.followings = user.followings.filter(
        (user) => user.toString() !== followingId
      );
      followingUser.followers = followingUser.followers.filter(
        (follower) => follower.toString() !== userId
      );
      await Promise.all([user.save(), followingUser.save()]);
      return (
        await this.userModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(userId) },
          },
          ...followListLookup("followings"),
        ])
      ).pop();
    } catch (err) {
      this.logger.error(err, `Failed to remove user following: ${userId}`);
      throw err;
    }
  }

  async getUserFollowings(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    try {
      const result = (
        await this.userModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(userId) },
          },
          ...followListLookup("followings"),
        ])
      ).pop();
      if (!result) {
        this.logger.warn(`No followings found for user: ${userId}`);
        return { followings: [] };
      }
      return result;
    } catch (err) {
      this.logger.error(err, `Failed to get user followings: ${userId}`);
      throw err;
    }
  }

  async recalculateAllFollowers() {
    try {
      const followerLists = await this.userModel.aggregate([
        { $unwind: "$followings" },
        { $group: { _id: "$followings", followers: { $push: "$_id" } } },
      ]);

      await this.userModel.updateMany({}, { $set: { followers: [] } });

      if (followerLists.length) {
        await this.userModel.bulkWrite(
          followerLists.map(({ _id, followers }) => ({
            updateOne: {
              filter: { _id },
              update: { $set: { followers } },
            },
          }))
        );
      }

      this.logger.log(`Recalculated followers for ${followerLists.length} users`);

      return { recalculatedUsers: followerLists.length };
    } catch (err) {
      this.logger.error(err, "Failed to recalculate followers");
      throw err;
    }
  }

  async getUserFollowers(userId: string) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException("User not found");
    try {
      const result = (
        await this.userModel.aggregate([
          {
            $match: { _id: new mongoose.Types.ObjectId(userId) },
          },
          ...followListLookup("followers"),
        ])
      ).pop();
      if (!result) {
        this.logger.warn(`No followers found for user: ${userId}`);
        return { followers: [] };
      }
      return result;
    } catch (err) {
      this.logger.error(err, `Failed to get user followers: ${userId}`);
      throw err;
    }
  }
}
