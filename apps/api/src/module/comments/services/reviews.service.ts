import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type IGetReviewsParams,
  type IReviewCategory,
  type IReviewsResponse,
  type IReviewsSummary,
} from "@mooncellar/schemas";
import {
  type IPlaythroughDocument,
  Playthrough,
} from "../../games/schemas/playthroughs.schema";
import { type User } from "../../user/schemas/user.schema";
import { type ILeanPlaythrough, type IViewer } from "../types/community.type";
import { getViewerId, isSameId, toObjectId } from "../utils/community.utils";
import { VotesService } from "./votes.service";
import { CommunityLookupService } from "./community-lookup.service";

const REVIEW_CATEGORIES: IReviewCategory[] = [
  "completed",
  "playing",
  "dropped",
  "played",
  "backlog",
];

const PUBLIC_REVIEW_FILTER = {
  isPublic: true,
  category: { $ne: "wishlist" },
  comment: { $nin: [null, ""] },
};

@Injectable()
export class ReviewsService {
  constructor(
    @InjectModel(Playthrough.name)
    private Playthroughs: Model<IPlaythroughDocument>,
    private readonly votes: VotesService,
    private readonly lookup: CommunityLookupService
  ) {}

  async getReviews(
    gameId: string,
    { category, sort, page, take }: IGetReviewsParams,
    viewer: IViewer
  ): Promise<IReviewsResponse> {
    const gameObjectId = toObjectId(gameId, "game id");
    const match = {
      ...PUBLIC_REVIEW_FILTER,
      gameId: gameObjectId,
    } as FilterQuery<IPlaythroughDocument>;
    const filter = category ? { ...match, category } : match;

    const [playthroughs, total, summary] = await Promise.all([
      this.Playthroughs.find(filter)
        .sort(
          sort === "new"
            ? { updatedAt: -1, _id: -1 }
            : { helpfulCount: -1, updatedAt: -1, _id: -1 }
        )
        .skip((page - 1) * take)
        .limit(take)
        .lean<ILeanPlaythrough[]>(),
      this.Playthroughs.countDocuments(filter),
      this.getSummary(gameObjectId, match),
    ]);

    const viewerId = getViewerId(viewer);
    const authorIds = [
      ...new Set(playthroughs.map((play) => String(play.userId))),
    ];
    const platformIds = [
      ...new Set(
        playthroughs
          .filter((play) => !!play.platformId)
          .map((play) => String(play.platformId))
      ),
    ];

    const [authors, ratings, platforms, helpful] = await Promise.all([
      this.lookup.getAuthors(authorIds),
      this.lookup.getRatings(gameObjectId, authorIds),
      this.lookup.getPlatformNames(platformIds),
      viewerId
        ? this.votes.findActiveTargets(
            "review",
            viewerId,
            playthroughs.map((play) => play._id)
          )
        : new Set<string>(),
    ]);

    return {
      results: playthroughs.map((play) => {
        const id = String(play._id);
        const authorId = String(play.userId);
        const platformId = play.platformId ? String(play.platformId) : null;

        return {
          _id: id,
          gameId: String(play.gameId),
          userId: authorId,
          ...(!!platformId && { platformId }),
          category: play.category,
          ...(!!play.date && { date: play.date }),
          ...(typeof play.time === "number" && { time: play.time }),
          comment: play.comment,
          ...(typeof play.isMastered === "boolean" && {
            isMastered: play.isMastered,
          }),
          updatedAt: play.updatedAt,
          isSpoiler: !!play.isSpoiler,
          helpfulCount: play.helpfulCount ?? 0,
          platformName: platformId ? (platforms.get(platformId) ?? null) : null,
          rating: ratings.get(authorId) ?? null,
          author: authors.get(authorId) ?? null,
          isHelpful: helpful.has(id),
        };
      }),
      total,
      summary,
    };
  }

  async setHelpful(id: string, viewer: User, isHelpful: boolean) {
    const userId = getViewerId(viewer);
    const review = await this.Playthroughs.findOne(
      {
        ...PUBLIC_REVIEW_FILTER,
        _id: toObjectId(id, "review id"),
      } as FilterQuery<IPlaythroughDocument>,
      { userId: 1, gameId: 1, helpfulCount: 1 }
    ).lean<ILeanPlaythrough>();

    if (!review) throw new NotFoundException("Review not found");

    if (isSameId(review.userId, userId)) {
      throw new BadRequestException(
        "You can't mark your own review as helpful"
      );
    }

    const isChanged = await this.votes.setVote(
      "review",
      review._id,
      review.gameId,
      userId,
      isHelpful
    );

    const updated = isChanged
      ? await this.Playthroughs.findByIdAndUpdate(
          review._id,
          { $inc: { helpfulCount: isHelpful ? 1 : -1 } },
          { new: true, projection: { helpfulCount: 1 } }
        ).lean<ILeanPlaythrough>()
      : review;

    return { count: updated?.helpfulCount ?? 0, isActive: isHelpful };
  }

  private async getSummary(
    gameId: mongoose.Types.ObjectId,
    match: FilterQuery<IPlaythroughDocument>
  ): Promise<IReviewsSummary> {
    const reviews = await this.Playthroughs.find(match, {
      userId: 1,
      category: 1,
    }).lean<ILeanPlaythrough[]>();

    const counts = new Map<string, number>();

    reviews.forEach((review) =>
      counts.set(review.category, (counts.get(review.category) ?? 0) + 1)
    );

    const reviewerIds = [
      ...new Set(reviews.map((review) => String(review.userId))),
    ];
    const ratings = await this.lookup.getRatings(gameId, reviewerIds);
    const values = reviewerIds
      .map((reviewerId) => ratings.get(reviewerId))
      .filter((rating): rating is number => typeof rating === "number");

    return {
      total: reviews.length,
      ratedCount: values.length,
      averageRating: values.length
        ? Math.round(
            (values.reduce((sum, rating) => sum + rating, 0) / values.length) *
              10
          ) / 10
        : null,
      categories: REVIEW_CATEGORIES.filter((category) =>
        counts.has(category)
      ).map((category) => ({
        category,
        count: counts.get(category) ?? 0,
      })),
    };
  }
}
