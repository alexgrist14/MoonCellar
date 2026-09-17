import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type Model } from "mongoose";
import type {
  ISearchUsersQuery,
  ISearchUsersResponse,
} from "@mooncellar/schemas";
import { Game } from "../../games/schemas/game.schema";
import { Playthrough } from "../../games/schemas/playthroughs.schema";
import { User } from "../../user/schemas/user.schema";
import type { ICollectionsViewer } from "../types/collections.type";
import { escapeRegExp, toIsoString } from "../utils/collections.utils";

type IUserRow = {
  _id: mongoose.Types.ObjectId;
  userName: string;
  avatar?: string;
  updatedAt?: Date;
  favorites?: mongoose.Types.ObjectId[];
  followersCount: number;
  isFollowedByViewer: boolean;
  followsViewer: boolean;
  favoriteGames: { _id: mongoose.Types.ObjectId; cover?: string | null }[];
};

@Injectable()
export class UsersSearchService {
  private readonly logger = new Logger(UsersSearchService.name);

  constructor(
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(Playthrough.name)
    private readonly playthroughModel: Model<Playthrough>
  ) {}

  async searchUsers(
    { q, page, take }: ISearchUsersQuery,
    viewer: ICollectionsViewer
  ): Promise<ISearchUsersResponse> {
    const pattern = escapeRegExp(q.trim());
    const match = { userName: { $regex: pattern, $options: "i" } };
    const viewerId = viewer
      ? new mongoose.Types.ObjectId(viewer._id.toString())
      : null;

    try {
      const [rows, total] = await Promise.all([
        this.userModel.aggregate<IUserRow>([
          { $match: match },
          {
            $addFields: {
              isPrefix: {
                $regexMatch: {
                  input: "$userName",
                  regex: `^${pattern}`,
                  options: "i",
                },
              },
              followersCount: { $size: { $ifNull: ["$followers", []] } },
              isFollowedByViewer: viewerId
                ? { $in: [viewerId, { $ifNull: ["$followers", []] }] }
                : false,
              followsViewer: viewerId
                ? { $in: [viewerId, { $ifNull: ["$followings", []] }] }
                : false,
            },
          },
          { $sort: { isPrefix: -1, followersCount: -1, userName: 1 } },
          { $skip: (page - 1) * take },
          { $limit: take },
          {
            $lookup: {
              from: this.gameModel.collection.name,
              let: { ids: { $ifNull: ["$favorites", []] } },
              pipeline: [
                { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
                { $project: { cover: 1 } },
              ],
              as: "favoriteGames",
            },
          },
          {
            $project: {
              userName: 1,
              avatar: 1,
              updatedAt: 1,
              favorites: 1,
              followersCount: 1,
              isFollowedByViewer: 1,
              followsViewer: 1,
              favoriteGames: 1,
            },
          },
        ]),
        this.userModel.countDocuments(match),
      ]);

      const gamesCounts = await this.countGames(rows.map((row) => row._id));

      return {
        total,
        results: rows.map((row) => ({
          _id: row._id.toString(),
          userName: row.userName,
          ...(row.avatar ? { avatar: row.avatar } : {}),
          updatedAt: toIsoString(row.updatedAt),
          gamesCount: gamesCounts.get(row._id.toString()) ?? 0,
          followersCount: row.followersCount,
          favoriteCovers: (row.favorites ?? [])
            .map(
              (id) =>
                row.favoriteGames.find(
                  (game) => game._id.toString() === id.toString()
                )?.cover
            )
            .filter((cover): cover is string => !!cover),
          isFollowedByViewer: !!row.isFollowedByViewer,
          followsViewer: !!row.followsViewer,
        })),
      };
    } catch (err) {
      this.logger.error(err, `Failed to search users: ${q}`);
      throw err;
    }
  }

  private async countGames(userIds: mongoose.Types.ObjectId[]) {
    if (!userIds.length) return new Map<string, number>();

    const rows = await this.playthroughModel.aggregate<{
      _id: string;
      count: number;
    }>([
      {
        $match: {
          userId: {
            $in: [...userIds, ...userIds.map((id) => id.toString())],
          },
        },
      },
      {
        $group: {
          _id: {
            userId: { $toString: "$userId" },
            gameId: { $toString: "$gameId" },
          },
        },
      },
      { $group: { _id: "$_id.userId", count: { $sum: 1 } } },
    ]);

    return new Map(rows.map((row) => [row._id, row.count]));
  }
}
