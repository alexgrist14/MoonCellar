import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { type FilterQuery, Model } from "mongoose";
import { type IComment, type ICommunityAuthor } from "@mooncellar/schemas";
import { User } from "../../user/schemas/user.schema";
import { Rating } from "../../user/schemas/user-ratings.schema";
import {
  Platform,
  type PlatformDocument,
} from "../../games/schemas/platform.schema";
import {
  type IPlaythroughDocument,
  Playthrough,
} from "../../games/schemas/playthroughs.schema";
import { type IObjectIdLike } from "../types/community.type";
import { asObjectId, asObjectIds } from "../utils/community.utils";

type IAuthorPlaythrough = NonNullable<IComment["authorPlaythrough"]>;

@Injectable()
export class CommunityLookupService {
  constructor(
    @InjectModel(User.name)
    private Users: Model<User>,
    @InjectModel(Rating.name)
    private Ratings: Model<Rating>,
    @InjectModel(Platform.name)
    private Platforms: Model<PlatformDocument>,
    @InjectModel(Playthrough.name)
    private Playthroughs: Model<IPlaythroughDocument>
  ) {}

  async getAuthors(userIds: IObjectIdLike[]) {
    if (!userIds.length) return new Map<string, ICommunityAuthor>();

    const users = await this.Users.find(
      { _id: { $in: asObjectIds(userIds) } } as FilterQuery<User>,
      { userName: 1, avatar: 1 }
    ).lean();

    return new Map<string, ICommunityAuthor>(
      users.map((user) => [
        String(user._id),
        {
          _id: String(user._id),
          userName: user.userName,
          ...(!!user.avatar && { avatar: user.avatar }),
        },
      ])
    );
  }

  async getAuthorPlaythroughs(gameId: IObjectIdLike, userIds: IObjectIdLike[]) {
    const result = new Map<string, IAuthorPlaythrough>();

    if (!userIds.length) return result;

    const playthroughs = await this.Playthroughs.find(
      {
        gameId: asObjectId(gameId),
        userId: { $in: asObjectIds(userIds) },
      } as FilterQuery<IPlaythroughDocument>,
      { userId: 1, category: 1, time: 1, isMastered: 1 }
    )
      .sort({ updatedAt: -1 })
      .lean();

    playthroughs.forEach((play) => {
      const key = String(play.userId);

      if (result.has(key)) return;

      result.set(key, {
        category: play.category,
        ...(typeof play.time === "number" && { time: play.time }),
        ...(typeof play.isMastered === "boolean" && {
          isMastered: play.isMastered,
        }),
      });
    });

    return result;
  }

  async getRatings(gameId: IObjectIdLike, userIds: IObjectIdLike[]) {
    if (!userIds.length) return new Map<string, number | null>();

    const ratings = await this.Ratings.find(
      {
        gameId: asObjectId(gameId),
        userId: { $in: asObjectIds(userIds) },
      } as FilterQuery<Rating>,
      { userId: 1, rating: 1 }
    ).lean();

    return new Map<string, number | null>(
      ratings.map((rating) => [String(rating.userId), rating.rating ?? null])
    );
  }

  async getPlatformNames(platformIds: IObjectIdLike[]) {
    if (!platformIds.length) return new Map<string, string>();

    const platforms = await this.Platforms.find(
      { _id: { $in: asObjectIds(platformIds) } } as FilterQuery<PlatformDocument>,
      { name: 1 }
    ).lean();

    return new Map<string, string>(
      platforms.map((platform) => [String(platform._id), platform.name])
    );
  }
}
