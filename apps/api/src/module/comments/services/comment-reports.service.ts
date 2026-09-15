import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type ICommentReportAction,
  type ICommentReportResolution,
  type ICommentReportsResponse,
  type ICommunityAuthor,
  type IGetCommentReportsParams,
  type IResolveCommentReportsResponse,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import { type User } from "../../user/schemas/user.schema";
import {
  CommentReport,
  type CommentReportDocument,
} from "../schemas/comment-report.schema";
import {
  GameComment,
  type GameCommentDocument,
} from "../schemas/game-comment.schema";
import { type ILeanComment } from "../types/community.type";
import { buildReportGroupsPipeline } from "../utils/comment-reports.utils";
import { getViewerId, toObjectId, uniqueIds } from "../utils/community.utils";
import { CommentsService } from "./comments.service";
import { CommunityLookupService } from "./community-lookup.service";

type IReportGroup = {
  commentId: mongoose.Types.ObjectId;
  count: number;
  firstReportedAt: Date;
  lastReportedAt: Date;
  reporterIds: mongoose.Types.ObjectId[];
  resolution?: ICommentReportResolution | null;
  resolvedAt?: Date | null;
  resolvedBy?: mongoose.Types.ObjectId | null;
};

type IReportGroupsFacet = {
  results: IReportGroup[];
  total: { count: number }[];
};

const toIsoDate = (date: Date) => new Date(date).toISOString();

@Injectable()
export class CommentReportsService {
  constructor(
    @InjectModel(CommentReport.name)
    private Reports: Model<CommentReportDocument>,
    @InjectModel(GameComment.name)
    private Comments: Model<GameCommentDocument>,
    @InjectModel(Game.name)
    private Games: Model<GameDocument>,
    private readonly comments: CommentsService,
    private readonly lookup: CommunityLookupService
  ) {}

  async getReports({
    status,
    page,
    take,
  }: IGetCommentReportsParams): Promise<ICommentReportsResponse> {
    const [facet] = await this.Reports.aggregate<IReportGroupsFacet>(
      buildReportGroupsPipeline(status, page, take)
    );
    const groups = facet?.results ?? [];

    const comments = groups.length
      ? await this.Comments.find(
          {
            _id: { $in: groups.map((group) => group.commentId) },
          } as FilterQuery<GameCommentDocument>,
          {
            gameId: 1,
            userId: 1,
            parentId: 1,
            reviewId: 1,
            body: 1,
            isSpoiler: 1,
            status: 1,
            createdAt: 1,
            updatedAt: 1,
          }
        ).lean<ILeanComment[]>()
      : [];
    const commentsById = new Map(
      comments.map((comment) => [String(comment._id), comment])
    );

    const gameIds = uniqueIds(comments.map((comment) => comment.gameId));
    const games = gameIds.length
      ? await this.Games.find(
          { _id: { $in: gameIds } } as FilterQuery<GameDocument>,
          { name: 1, slug: 1 }
        ).lean()
      : [];
    const gamesById = new Map(games.map((game) => [String(game._id), game]));

    const authors = await this.lookup.getAuthors(
      uniqueIds([
        ...comments.map((comment) => comment.userId),
        ...groups.flatMap((group) => group.reporterIds),
        ...groups.map((group) => group.resolvedBy),
      ])
    );
    const getAuthor = (id?: mongoose.Types.ObjectId | null) =>
      id ? (authors.get(String(id)) ?? null) : null;

    return {
      results: groups.map((group) => {
        const comment = commentsById.get(String(group.commentId));
        const game = comment ? gamesById.get(String(comment.gameId)) : undefined;

        return {
          commentId: String(group.commentId),
          comment: comment
            ? {
                status: comment.status,
                body: comment.body,
                isSpoiler: comment.isSpoiler,
                createdAt: toIsoDate(comment.createdAt),
                updatedAt: toIsoDate(comment.updatedAt),
                isReply: !!comment.parentId,
                isOnReview: !!comment.reviewId,
                author: getAuthor(comment.userId),
                game: game
                  ? { _id: String(game._id), name: game.name, slug: game.slug }
                  : null,
              }
            : null,
          reportsCount: group.count,
          firstReportedAt: toIsoDate(group.firstReportedAt),
          lastReportedAt: toIsoDate(group.lastReportedAt),
          reporters: group.reporterIds
            .map((id) => getAuthor(id))
            .filter((author): author is ICommunityAuthor => !!author)
            .reverse(),
          resolution: group.resolution ?? null,
          resolvedAt: group.resolvedAt ? toIsoDate(group.resolvedAt) : null,
          resolvedBy: getAuthor(group.resolvedBy),
        };
      }),
      total: facet?.total[0]?.count ?? 0,
    };
  }

  async resolve(
    commentId: string,
    action: ICommentReportAction,
    moderator: User
  ): Promise<IResolveCommentReportsResponse> {
    const id = toObjectId(commentId, "comment id");
    const comment = await this.Comments.findById(id, {
      status: 1,
    }).lean<ILeanComment>();

    if (!comment) throw new NotFoundException("Comment not found");

    if (comment.status !== "deleted" && action === "hide") {
      await this.comments.updateStatus(commentId, "hidden", moderator);
    }

    if (comment.status !== "deleted" && action === "delete") {
      await this.comments.deleteComment(commentId, moderator);
    }

    const updated = await this.Comments.findById(id, {
      status: 1,
    }).lean<ILeanComment>();
    const status = updated?.status ?? comment.status;

    await this.comments.resolveReports(
      id,
      action === "dismiss" || status === "visible" ? "dismissed" : status,
      getViewerId(moderator)
    );
    await this.Comments.updateOne(
      { _id: id },
      { $set: { reportsCount: 0 } },
      { timestamps: false }
    );

    return { status };
  }
}
