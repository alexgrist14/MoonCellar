import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { type FilterQuery, Model } from "mongoose";
import {
  type IGetReviewsParams,
  type IGetUserReviewsParams,
  type IReviewCategory,
  type IReviewsResponse,
  type IReviewsSummary,
  type IUserReview,
  type IUserReviewGame,
  type IUserReviewsResponse,
  type IUserReviewsSort,
  type IUserReviewStatus,
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

const USER_REVIEW_STATUSES: IUserReviewStatus[] = [
  "playing",
  "completed",
  "mastered",
  "played",
  "backlog",
  "dropped",
];

const STATUS_EXPRESSION = {
  $cond: [{ $eq: ["$isMastered", true] }, "mastered", "$category"],
};

const getStatusFilter = (status: IUserReviewStatus) =>
  status === "mastered"
    ? { isMastered: true }
    : { category: status, isMastered: { $ne: true } };

interface IUserReviewsAggregation {
  results: (ILeanPlaythrough & {
    rating: number | null;
    game: {
      _id: mongoose.Types.ObjectId;
      name: string;
      slug: string;
      cover?: string;
    }[];
    platform: { name: string }[];
  })[];
  total: { count: number }[];
  statuses: { _id: string; count: number }[];
  ratings: { total: number; ratedCount: number; ratingSum: number }[];
  games: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    cover?: string;
  }[];
}

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

  async getUserReviews(
    userId: string,
    {
      gameIds,
      status,
      ratingMin,
      ratingMax,
      sort,
      order,
      page,
      take,
    }: IGetUserReviewsParams,
    viewer: IViewer
  ): Promise<IUserReviewsResponse> {
    const authorId = toObjectId(userId, "user id");
    const viewerId = getViewerId(viewer);

    const match = {
      userId: authorId,
      category: { $ne: "wishlist" },
      comment: { $nin: [null, ""] },
    } as FilterQuery<IPlaythroughDocument>;

    const hasRatingRange = ratingMin !== undefined || ratingMax !== undefined;
    const filter = {
      ...(!!gameIds?.length && {
        gameId: { $in: gameIds.map((id) => toObjectId(id, "game id")) },
      }),
      ...(!!status && getStatusFilter(status)),
      ...(hasRatingRange && {
        rating: {
          ...(ratingMin !== undefined && { $gte: ratingMin }),
          ...(ratingMax !== undefined && { $lte: ratingMax }),
        },
      }),
    } as FilterQuery<IPlaythroughDocument>;

    const direction: 1 | -1 = order === "asc" ? 1 : -1;
    const sortStages: Record<IUserReviewsSort, Record<string, 1 | -1>> = {
      date: { updatedAt: direction, _id: direction },
      rating: { rating: direction, updatedAt: -1, _id: -1 },
      helpful: { helpfulCount: direction, updatedAt: -1, _id: -1 },
    };

    const [aggregated] =
      await this.Playthroughs.aggregate<IUserReviewsAggregation>([
        { $match: match },
        {
          $lookup: {
            from: "ratings",
            let: { gameId: "$gameId" },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      { $eq: ["$userId", authorId] },
                      { $eq: ["$gameId", "$$gameId"] },
                    ],
                  },
                },
              },
              { $project: { rating: 1 } },
            ],
            as: "userRating",
          },
        },
        {
          $addFields: {
            rating: { $ifNull: [{ $first: "$userRating.rating" }, null] },
          },
        },
        {
          $facet: {
            results: [
              { $match: filter },
              { $sort: sortStages[sort] },
              { $skip: (page - 1) * take },
              { $limit: take },
              {
                $lookup: {
                  from: "games",
                  localField: "gameId",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1, slug: 1, cover: 1 } }],
                  as: "game",
                },
              },
              {
                $lookup: {
                  from: "platforms",
                  localField: "platformId",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1 } }],
                  as: "platform",
                },
              },
              { $project: { userRating: 0 } },
            ],
            total: [{ $match: filter }, { $count: "count" }],
            statuses: [
              { $group: { _id: STATUS_EXPRESSION, count: { $sum: 1 } } },
            ],
            ratings: [
              {
                $group: {
                  _id: null,
                  total: { $sum: 1 },
                  ratedCount: {
                    $sum: { $cond: [{ $ne: ["$rating", null] }, 1, 0] },
                  },
                  ratingSum: { $sum: { $ifNull: ["$rating", 0] } },
                },
              },
            ],
            games: [
              { $group: { _id: "$gameId" } },
              {
                $lookup: {
                  from: "games",
                  localField: "_id",
                  foreignField: "_id",
                  pipeline: [{ $project: { name: 1, slug: 1, cover: 1 } }],
                  as: "game",
                },
              },
              { $unwind: "$game" },
              { $replaceRoot: { newRoot: "$game" } },
              { $sort: { name: 1 } },
            ],
          },
        },
      ]);

    const reviews = aggregated?.results ?? [];
    const helpful = viewerId
      ? await this.votes.findActiveTargets(
          "review",
          viewerId,
          reviews.map((review) => review._id)
        )
      : new Set<string>();

    const [stats] = aggregated?.ratings ?? [];
    const counts = new Map(
      (aggregated?.statuses ?? []).map(({ _id, count }) => [_id, count])
    );

    return {
      results: reviews.map((review) => this.toUserReview(review, helpful)),
      total: aggregated?.total?.[0]?.count ?? 0,
      summary: {
        total: stats?.total ?? 0,
        ratedCount: stats?.ratedCount ?? 0,
        averageRating: stats?.ratedCount
          ? Math.round((stats.ratingSum / stats.ratedCount) * 10) / 10
          : null,
        statuses: USER_REVIEW_STATUSES.filter((item) => counts.has(item)).map(
          (item) => ({ status: item, count: counts.get(item) ?? 0 })
        ),
      },
      games: (aggregated?.games ?? []).map(this.toReviewGame),
    };
  }

  private toReviewGame(game: {
    _id: mongoose.Types.ObjectId;
    name: string;
    slug: string;
    cover?: string;
  }): IUserReviewGame {
    return {
      _id: String(game._id),
      name: game.name,
      slug: game.slug,
      cover: game.cover ?? null,
    };
  }

  private toUserReview(
    review: IUserReviewsAggregation["results"][number],
    helpful: Set<string>
  ): IUserReview {
    const id = String(review._id);
    const [game] = review.game;
    const [platform] = review.platform;

    return {
      _id: id,
      gameId: String(review.gameId),
      userId: String(review.userId),
      ...(!!review.platformId && { platformId: String(review.platformId) }),
      category: review.category,
      ...(!!review.date && { date: review.date }),
      ...(typeof review.time === "number" && { time: review.time }),
      comment: review.comment,
      ...(typeof review.isMastered === "boolean" && {
        isMastered: review.isMastered,
      }),
      updatedAt: review.updatedAt,
      isSpoiler: !!review.isSpoiler,
      isPublic: !!review.isPublic,
      helpfulCount: review.helpfulCount ?? 0,
      platformName: platform?.name ?? null,
      rating: review.rating ?? null,
      isHelpful: helpful.has(id),
      game: game ? this.toReviewGame(game) : null,
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
