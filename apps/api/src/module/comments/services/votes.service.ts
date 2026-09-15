import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { type FilterQuery, Model, type UpdateQuery } from "mongoose";
import {
  CommentVote,
  type CommentVoteDocument,
  type ICommentVoteTarget,
} from "../schemas/comment-vote.schema";
import { type IObjectIdLike } from "../types/community.type";
import { isDuplicateKeyError } from "../utils/community.utils";

@Injectable()
export class VotesService {
  constructor(
    @InjectModel(CommentVote.name)
    private Votes: Model<CommentVoteDocument>
  ) {}

  async setVote(
    target: ICommentVoteTarget,
    targetId: IObjectIdLike,
    gameId: IObjectIdLike,
    userId: IObjectIdLike,
    isActive: boolean
  ) {
    const key = {
      target,
      targetId,
      userId,
    } as FilterQuery<CommentVoteDocument>;

    if (!isActive) {
      const { deletedCount } = await this.Votes.deleteOne(key);

      return deletedCount > 0;
    }

    try {
      const { upsertedCount } = await this.Votes.updateOne(
        key,
        { $setOnInsert: { gameId } } as UpdateQuery<CommentVoteDocument>,
        { upsert: true }
      );

      return upsertedCount > 0;
    } catch (error) {
      if (isDuplicateKeyError(error)) return false;

      throw error;
    }
  }

  async findActiveTargets(
    target: ICommentVoteTarget,
    userId: IObjectIdLike,
    targetIds: IObjectIdLike[]
  ) {
    if (!targetIds.length) return new Set<string>();

    const votes = await this.Votes.find(
      {
        target,
        userId,
        targetId: { $in: targetIds },
      } as FilterQuery<CommentVoteDocument>,
      { targetId: 1 }
    ).lean();

    return new Set(votes.map((vote) => String(vote.targetId)));
  }
}
