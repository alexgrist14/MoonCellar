import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as bcrypt from "bcryptjs";
import mongoose, { type FilterQuery, Model } from "mongoose";
import { User } from "../schemas/user.schema";
import { UserLogs } from "../schemas/user-logs.schema";
import { Rating } from "../schemas/user-ratings.schema";
import { Playthrough } from "../../games/schemas/playthroughs.schema";
import { GameComment } from "../../comments/schemas/game-comment.schema";
import { CommentVote } from "../../comments/schemas/comment-vote.schema";
import { CommentReport } from "../../comments/schemas/comment-report.schema";
import { CustomList } from "../../collections/schemas/custom-list.schema";
import { CustomListLike } from "../../collections/schemas/custom-list-like.schema";
import { Notification } from "../../notifications/schemas/notification.schema";
import { PushSubscription } from "../../notifications/schemas/push-subscription.schema";
import { GauntletHistory } from "../schemas/gauntlet-history.schema";
import { S3_FOLDERS } from "../../../shared/s3";
import { FileService } from "./file-upload.service";
import { UserRatingsService } from "./user-ratings.service";

type IId = mongoose.Types.ObjectId;

@Injectable()
export class AccountDeletionService {
  private readonly logger = new Logger(AccountDeletionService.name);

  constructor(
    @InjectModel(User.name) private readonly users: Model<User>,
    @InjectModel(UserLogs.name) private readonly logs: Model<UserLogs>,
    @InjectModel(Rating.name) private readonly ratings: Model<Rating>,
    @InjectModel(Playthrough.name)
    private readonly playthroughs: Model<Playthrough>,
    @InjectModel(GameComment.name)
    private readonly comments: Model<GameComment>,
    @InjectModel(CommentVote.name) private readonly votes: Model<CommentVote>,
    @InjectModel(CommentReport.name)
    private readonly reports: Model<CommentReport>,
    @InjectModel(CustomList.name) private readonly lists: Model<CustomList>,
    @InjectModel(CustomListLike.name)
    private readonly listLikes: Model<CustomListLike>,
    @InjectModel(Notification.name)
    private readonly notifications: Model<Notification>,
    @InjectModel(PushSubscription.name)
    private readonly pushSubscriptions: Model<PushSubscription>,
    @InjectModel(GauntletHistory.name)
    private readonly gauntletHistory: Model<GauntletHistory>,
    private readonly ratingsService: UserRatingsService,
    private readonly fileService: FileService
  ) {}

  async deleteOwnAccount(userId: string, password: string) {
    const user = await this.users.findById(userId).select("password").lean();

    if (!user) throw new NotFoundException("User not found");

    if (!(await bcrypt.compare(password, user.password))) {
      throw new ForbiddenException("Password does not match");
    }

    await this.deleteAccount(userId);
  }

  async deleteAccount(userId: string) {
    const user = await this.users
      .findById(userId)
      .select("avatar background")
      .lean();

    if (!user) throw new NotFoundException("User not found");

    const id = new mongoose.Types.ObjectId(userId);
    const anyId = { $in: [id, userId] };

    await this.deleteRatings(anyId);
    await this.logs.deleteMany({ userId: anyId } as FilterQuery<UserLogs>);
    await this.deleteVotes(id);
    await this.deletePlaythroughs(anyId);
    await this.deleteComments(id);
    await this.deleteLists(id);
    await this.deleteNotifications(id);
    await this.pushSubscriptions.deleteMany({ userId: id });
    await this.gauntletHistory.deleteMany({ userId: id });
    await this.users.updateMany(
      { $or: [{ followings: id }, { followers: id }] },
      { $pull: { followings: id, followers: id } },
      { timestamps: false }
    );
    await this.users.deleteOne({ _id: id });

    await this.deleteFiles(user);
    this.logger.log(`Deleted account ${userId}`);
  }

  private async deleteRatings(userId: object) {
    const filter = { userId } as FilterQuery<Rating>;
    const gameIds: IId[] = await this.ratings.distinct("gameId", filter);

    await this.ratings.deleteMany(filter);
    await Promise.all(
      gameIds.map((gameId) =>
        this.ratingsService.recalculateAverageRating(gameId)
      )
    );
  }

  private async deleteVotes(userId: IId) {
    const votes = await this.votes
      .find({ userId }, { target: 1, targetId: 1 })
      .lean();
    const targets = (target: CommentVote["target"]) =>
      votes.filter((vote) => vote.target === target).map((v) => v.targetId);

    await this.comments.updateMany(
      { _id: { $in: targets("comment") } },
      { $inc: { likesCount: -1 } },
      { timestamps: false }
    );
    await this.playthroughs.updateMany(
      { _id: { $in: targets("review") } } as FilterQuery<Playthrough>,
      { $inc: { helpfulCount: -1 } }
    );
    await this.votes.deleteMany({ userId });
  }

  private async deletePlaythroughs(userId: object) {
    const filter = { userId } as FilterQuery<Playthrough>;
    const reviewIds: IId[] = await this.playthroughs.distinct("_id", filter);

    await this.playthroughs.deleteMany(filter);
    await this.votes.deleteMany({
      target: "review",
      targetId: { $in: reviewIds },
    });
  }

  private async deleteComments(userId: IId) {
    const comments = await this.comments
      .find(
        { userId, status: { $ne: "deleted" } },
        { parentId: 1, status: 1 }
      )
      .lean();

    if (!comments.length) return;

    const commentIds = comments.map((comment) => comment._id);
    const visibleReplies = new Map<string, number>();

    comments.forEach(({ parentId, status }) => {
      if (!parentId || status !== "visible") return;
      const key = String(parentId);
      visibleReplies.set(key, (visibleReplies.get(key) ?? 0) + 1);
    });

    await this.comments.updateMany(
      { _id: { $in: commentIds } },
      { $set: { status: "deleted", body: "", reportsCount: 0 } }
    );
    await Promise.all(
      [...visibleReplies].map(([parentId, count]) =>
        this.comments.updateOne(
          { _id: new mongoose.Types.ObjectId(parentId) },
          { $inc: { repliesCount: -count } },
          { timestamps: false }
        )
      )
    );
    await this.reports.updateMany(
      { commentId: { $in: commentIds }, status: { $ne: "resolved" } },
      {
        $set: {
          status: "resolved",
          resolution: "deleted",
          resolvedAt: new Date(),
          resolvedBy: null,
        },
      }
    );
  }

  private async deleteLists(userId: IId) {
    const ownListIds: IId[] = await this.lists.distinct("_id", { userId });

    await this.lists.deleteMany({ _id: { $in: ownListIds } });
    await this.listLikes.deleteMany({ listId: { $in: ownListIds } });

    const likedListIds: IId[] = await this.listLikes.distinct("listId", {
      userId,
    });

    await this.listLikes.deleteMany({ userId });
    await this.lists.updateMany(
      { _id: { $in: likedListIds } },
      { $inc: { likesCount: -1 } },
      { timestamps: false }
    );
  }

  private async deleteNotifications(userId: IId) {
    await this.notifications.deleteMany({ userId });

    const actedIds: IId[] = await this.notifications.distinct("_id", {
      actorIds: userId,
    });

    await this.notifications.updateMany(
      { _id: { $in: actedIds } },
      { $pull: { actorIds: userId } },
      { timestamps: false }
    );
    await this.notifications.deleteMany({
      _id: { $in: actedIds },
      actorIds: { $size: 0 },
    });
  }

  private async deleteFiles(user: Pick<User, "avatar" | "background">) {
    const files = [
      [S3_FOLDERS.avatars, user.avatar],
      [S3_FOLDERS.backgrounds, user.background],
    ] as const;

    await Promise.all(
      files.map(async ([folder, url]) => {
        const key = this.fileService.getKeyFromUrl(folder, url);

        if (!key) return;

        await this.fileService.deleteFile(key, folder).catch(() => undefined);
      })
    );
  }
}
