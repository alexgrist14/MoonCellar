import {
  BadRequestException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type IComment,
  type ICommentReportResolution,
  type ICommentStatus,
  type ICreateCommentParams,
  type IGetCommentsParams,
  type IGetRepliesParams,
  type IUpdateCommentParams,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  type IPlaythroughDocument,
  Playthrough,
} from "../../games/schemas/playthroughs.schema";
import { type User } from "../../user/schemas/user.schema";
import { sanitizeRichText } from "../../../shared/utils/rich-text.utils";
import {
  GameComment,
  type GameCommentDocument,
} from "../schemas/game-comment.schema";
import {
  CommentReport,
  type CommentReportDocument,
} from "../schemas/comment-report.schema";
import {
  type ILeanComment,
  type ILeanPlaythrough,
  type IViewer,
} from "../types/community.type";
import {
  getPlainTextExcerpt,
  getViewerId,
  isAdminViewer,
  isDuplicateKeyError,
  isSameId,
  toObjectId,
  uniqueIds,
} from "../utils/community.utils";
import { CommentsGateway } from "../gateways/comments.gateway";
import { VotesService } from "./votes.service";
import { CommunityLookupService } from "./community-lookup.service";

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_COMMENTS = 5;
const REVIEW_EXCERPT_LENGTH = 160;

@Injectable()
export class CommentsService {
  constructor(
    @InjectModel(GameComment.name)
    private Comments: Model<GameCommentDocument>,
    @InjectModel(CommentReport.name)
    private Reports: Model<CommentReportDocument>,
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    @InjectModel(Playthrough.name)
    private Playthroughs: Model<IPlaythroughDocument>,
    private readonly votes: VotesService,
    private readonly lookup: CommunityLookupService,
    private readonly events: CommentsGateway
  ) {}

  private readableStatuses(viewer: IViewer): ICommentStatus[] {
    return isAdminViewer(viewer) ? ["visible", "hidden"] : ["visible"];
  }

  async getComments(
    gameId: string,
    { sort, page, take }: IGetCommentsParams,
    viewer: IViewer
  ) {
    const match = {
      gameId: toObjectId(gameId, "game id"),
      parentId: null,
      $or: [
        { status: { $in: this.readableStatuses(viewer) } },
        { repliesCount: { $gt: 0 } },
      ],
    } as FilterQuery<GameCommentDocument>;

    const [comments, total] = await Promise.all([
      this.Comments.find(match)
        .sort(
          sort === "new"
            ? { createdAt: -1, _id: -1 }
            : { likesCount: -1, createdAt: -1, _id: -1 }
        )
        .skip((page - 1) * take)
        .limit(take)
        .lean<ILeanComment[]>(),
      this.Comments.countDocuments(match),
    ]);

    return { results: await this.decorate(comments, viewer), total };
  }

  async getReplies(
    commentId: string,
    { page, take }: IGetRepliesParams,
    viewer: IViewer
  ) {
    const parent = await this.Comments.exists({
      _id: toObjectId(commentId, "comment id"),
    });

    if (!parent) throw new NotFoundException("Comment not found");

    const match = {
      parentId: parent._id,
      status: { $in: this.readableStatuses(viewer) },
    } as FilterQuery<GameCommentDocument>;

    const [replies, total] = await Promise.all([
      this.Comments.find(match)
        .sort({ createdAt: 1, _id: 1 })
        .skip((page - 1) * take)
        .limit(take)
        .lean<ILeanComment[]>(),
      this.Comments.countDocuments(match),
    ]);

    return { results: await this.decorate(replies, viewer), total };
  }

  async createComment(
    data: ICreateCommentParams,
    viewer: User,
    socketId?: string
  ) {
    const userId = getViewerId(viewer);
    const gameId = toObjectId(data.gameId, "game id");

    if (!(await this.Games.exists({ _id: gameId }))) {
      throw new NotFoundException("Game not found");
    }

    const recentCount = await this.Comments.countDocuments({
      userId,
      createdAt: { $gt: new Date(Date.now() - RATE_LIMIT_WINDOW_MS) },
    });

    if (recentCount >= RATE_LIMIT_COMMENTS) {
      throw new HttpException(
        "You are posting too fast. Try again in a minute.",
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    const body = sanitizeRichText(data.body);

    if (!body) throw new BadRequestException("The comment is empty");

    let parentId: mongoose.Types.ObjectId | null = null;
    let replyToId: mongoose.Types.ObjectId | null = null;
    let reviewId: mongoose.Types.ObjectId | null = null;

    if (data.parentId) {
      const parent = await this.Comments.findOne({
        _id: toObjectId(data.parentId, "comment id"),
        gameId,
      }).lean<ILeanComment>();

      if (!parent) throw new NotFoundException("Comment not found");

      if (parent.status !== "visible") {
        throw new BadRequestException("This comment can't be replied to");
      }

      parentId = parent.parentId ?? parent._id;
      replyToId = parent._id;
    } else if (data.reviewId) {
      const review = await this.Playthroughs.exists({
        _id: toObjectId(data.reviewId, "review id"),
        gameId,
        isPublic: true,
      } as FilterQuery<IPlaythroughDocument>);

      if (!review) throw new NotFoundException("Review not found");

      reviewId = review._id;
    }

    const comment = await this.Comments.create({
      gameId,
      userId,
      parentId,
      replyToId,
      reviewId,
      body,
      isSpoiler: data.isSpoiler,
    });

    const parentRepliesCount = parentId
      ? await this.incrementReplies(parentId, 1)
      : null;

    this.events.commentCreated(
      {
        gameId: String(gameId),
        commentId: String(comment._id),
        parentId: parentId ? String(parentId) : null,
        parentRepliesCount,
      },
      socketId
    );

    return this.decorateOne(comment, viewer);
  }

  async updateComment(
    id: string,
    data: IUpdateCommentParams,
    viewer: User,
    socketId?: string
  ) {
    const comment = await this.findExisting(id);

    if (!isSameId(comment.userId, getViewerId(viewer))) {
      throw new ForbiddenException("You can only edit your own comments");
    }

    if (comment.status !== "visible") {
      throw new ForbiddenException("A hidden comment can't be edited");
    }

    const body = sanitizeRichText(data.body);

    if (!body) throw new BadRequestException("The comment is empty");

    comment.body = body;
    comment.isSpoiler = data.isSpoiler;
    await comment.save();

    this.events.commentUpdated(
      {
        gameId: String(comment.gameId),
        commentId: String(comment._id),
        body: comment.body,
        isSpoiler: comment.isSpoiler,
        updatedAt: new Date(comment.updatedAt).toISOString(),
      },
      socketId
    );

    return this.decorateOne(comment, viewer);
  }

  async deleteComment(id: string, viewer: User, socketId?: string) {
    const comment = await this.findExisting(id);

    if (
      !isSameId(comment.userId, getViewerId(viewer)) &&
      !isAdminViewer(viewer)
    ) {
      throw new ForbiddenException("You can only delete your own comments");
    }

    await this.changeStatus(comment, "deleted", viewer, socketId);

    return this.decorateOne(comment, viewer);
  }

  async updateStatus(
    id: string,
    status: Exclude<ICommentStatus, "deleted">,
    viewer: User,
    socketId?: string
  ) {
    const comment = await this.findExisting(id);

    if (comment.status !== status) {
      await this.changeStatus(comment, status, viewer, socketId);
    }

    return this.decorateOne(comment, viewer);
  }

  async setLike(
    id: string,
    viewer: User,
    isLiked: boolean,
    socketId?: string
  ) {
    const userId = getViewerId(viewer);
    const comment = await this.findExisting(id);

    if (comment.status !== "visible") {
      throw new NotFoundException("Comment not found");
    }

    if (isSameId(comment.userId, userId)) {
      throw new BadRequestException("You can't like your own comment");
    }

    const isChanged = await this.votes.setVote(
      "comment",
      comment._id,
      comment.gameId,
      userId,
      isLiked
    );

    const updated = isChanged
      ? await this.Comments.findByIdAndUpdate(
          comment._id,
          { $inc: { likesCount: isLiked ? 1 : -1 } },
          { new: true, timestamps: false, projection: { likesCount: 1 } }
        ).lean<ILeanComment>()
      : comment;

    if (isChanged && updated) {
      this.events.commentLikesChanged(
        {
          gameId: String(comment.gameId),
          commentId: String(comment._id),
          likesCount: updated.likesCount,
        },
        socketId
      );
    }

    return { count: updated?.likesCount ?? 0, isActive: isLiked };
  }

  async reportComment(id: string, viewer: User) {
    const userId = getViewerId(viewer);
    const comment = await this.findExisting(id);

    if (comment.status !== "visible") {
      throw new NotFoundException("Comment not found");
    }

    if (isSameId(comment.userId, userId)) {
      throw new BadRequestException("You can't report your own comment");
    }

    try {
      await this.Reports.create({ commentId: comment._id, userId });
      await this.Comments.updateOne(
        { _id: comment._id },
        { $inc: { reportsCount: 1 } },
        { timestamps: false }
      );
    } catch (error) {
      if (!isDuplicateKeyError(error)) throw error;
    }

    return { isReported: true };
  }

  async resolveReports(
    commentId: mongoose.Types.ObjectId,
    resolution: ICommentReportResolution,
    moderatorId: mongoose.Types.ObjectId | null
  ) {
    await this.Reports.updateMany(
      {
        commentId,
        status: { $ne: "resolved" },
      } as FilterQuery<CommentReportDocument>,
      {
        $set: {
          status: "resolved",
          resolution,
          resolvedAt: new Date(),
          resolvedBy: moderatorId,
        },
      }
    );
  }

  private async findExisting(id: string) {
    const comment = await this.Comments.findById(toObjectId(id, "comment id"));

    if (!comment || comment.status === "deleted") {
      throw new NotFoundException("Comment not found");
    }

    return comment;
  }

  private async changeStatus(
    comment: GameCommentDocument,
    status: ICommentStatus,
    moderator: User,
    socketId?: string
  ) {
    const repliesDelta =
      Number(status === "visible") - Number(comment.status === "visible");

    comment.status = status;

    if (status === "deleted") comment.body = "";
    if (status !== "visible") comment.reportsCount = 0;

    await comment.save();

    if (status !== "visible") {
      await this.resolveReports(comment._id, status, getViewerId(moderator));
    }

    const parentRepliesCount =
      repliesDelta && comment.parentId
        ? await this.incrementReplies(comment.parentId, repliesDelta)
        : null;

    this.events.commentStatusChanged(
      {
        gameId: String(comment.gameId),
        commentId: String(comment._id),
        parentId: comment.parentId ? String(comment.parentId) : null,
        parentRepliesCount,
        status,
      },
      socketId
    );
  }

  private async incrementReplies(
    parentId: mongoose.Types.ObjectId,
    delta: number
  ) {
    const parent = await this.Comments.findByIdAndUpdate(
      parentId,
      { $inc: { repliesCount: delta } },
      { new: true, timestamps: false, projection: { repliesCount: 1 } }
    ).lean<ILeanComment>();

    return parent?.repliesCount ?? null;
  }

  private async findReported(
    userId: mongoose.Types.ObjectId,
    commentIds: mongoose.Types.ObjectId[]
  ) {
    const reports = await this.Reports.find(
      { userId, commentId: { $in: commentIds } },
      { commentId: 1 }
    ).lean();

    return new Set(reports.map((report) => String(report.commentId)));
  }

  private async decorateOne(comment: GameCommentDocument, viewer: IViewer) {
    const [result] = await this.decorate(
      [comment.toObject() as ILeanComment],
      viewer
    );

    return result;
  }

  private async decorate(
    comments: ILeanComment[],
    viewer: IViewer
  ): Promise<IComment[]> {
    if (!comments.length) return [];

    const viewerId = getViewerId(viewer);
    const canModerate = isAdminViewer(viewer);
    const gameId = comments[0].gameId;
    const commentIds = comments.map((comment) => comment._id);
    const replyToIds = uniqueIds(comments.map((comment) => comment.replyToId));
    const reviewIds = uniqueIds(comments.map((comment) => comment.reviewId));

    const isReadable = (item: Pick<ILeanComment, "status">) =>
      item.status === "visible" || (canModerate && item.status === "hidden");

    const [targets, reviews] = await Promise.all([
      replyToIds.length
        ? this.Comments.find(
            { _id: { $in: replyToIds } } as FilterQuery<GameCommentDocument>,
            { userId: 1, status: 1 }
          ).lean<ILeanComment[]>()
        : ([] as ILeanComment[]),
      reviewIds.length
        ? this.Playthroughs.find(
            { _id: { $in: reviewIds } } as FilterQuery<IPlaythroughDocument>,
            { userId: 1, category: 1, comment: 1, isPublic: 1 }
          ).lean<ILeanPlaythrough[]>()
        : ([] as ILeanPlaythrough[]),
    ]);

    const targetsById = new Map<string, ILeanComment>(
      targets.map((target) => [String(target._id), target])
    );
    const publicReviews = new Map<string, ILeanPlaythrough>(
      reviews
        .filter((review) => review.isPublic && !!review.comment)
        .map((review) => [String(review._id), review])
    );

    const commentAuthorIds = uniqueIds(
      comments.map((comment) => comment.userId)
    );
    const reviewAuthorIds = uniqueIds(
      [...publicReviews.values()].map((review) => review.userId)
    );
    const authorIds = uniqueIds([
      ...commentAuthorIds,
      ...targets.filter(isReadable).map((target) => target.userId),
      ...reviewAuthorIds,
    ]);

    const [authors, playthroughs, ratings, liked, reported] =
      await Promise.all([
        this.lookup.getAuthors(authorIds),
        this.lookup.getAuthorPlaythroughs(gameId, commentAuthorIds),
        this.lookup.getRatings(gameId, reviewAuthorIds),
        viewerId
          ? this.votes.findActiveTargets("comment", viewerId, commentIds)
          : new Set<string>(),
        viewerId
          ? this.findReported(viewerId, commentIds)
          : new Set<string>(),
      ]);

    return comments.map((comment) => {
      const id = String(comment._id);
      const authorId = String(comment.userId);
      const isCommentReadable = isReadable(comment);
      const target = comment.replyToId
        ? targetsById.get(String(comment.replyToId))
        : undefined;
      const review = comment.reviewId
        ? publicReviews.get(String(comment.reviewId))
        : undefined;

      return {
        _id: id,
        gameId: String(comment.gameId),
        userId: isCommentReadable ? authorId : "",
        parentId: comment.parentId ? String(comment.parentId) : null,
        replyToId: comment.replyToId ? String(comment.replyToId) : null,
        reviewId: comment.reviewId ? String(comment.reviewId) : null,
        body: isCommentReadable ? comment.body : "",
        isSpoiler: comment.isSpoiler,
        likesCount: comment.likesCount,
        repliesCount: comment.repliesCount,
        ...(canModerate && { reportsCount: comment.reportsCount }),
        status: comment.status,
        createdAt: new Date(comment.createdAt).toISOString(),
        updatedAt: new Date(comment.updatedAt).toISOString(),
        replyTo: comment.replyToId
          ? {
              _id: String(comment.replyToId),
              author:
                target && isReadable(target)
                  ? (authors.get(String(target.userId)) ?? null)
                  : null,
            }
          : null,
        review:
          isCommentReadable && review
            ? {
                _id: String(review._id),
                author: authors.get(String(review.userId)) ?? null,
                category: review.category,
                rating: ratings.get(String(review.userId)) ?? null,
                excerpt: getPlainTextExcerpt(
                  review.comment,
                  REVIEW_EXCERPT_LENGTH
                ),
              }
            : null,
        author: isCommentReadable ? (authors.get(authorId) ?? null) : null,
        authorPlaythrough: isCommentReadable
          ? (playthroughs.get(authorId) ?? null)
          : null,
        isLiked: liked.has(id),
        isReported: reported.has(id),
      };
    });
  }
}
