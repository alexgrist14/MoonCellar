import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, {
  type FilterQuery,
  type Model,
  type PipelineStage,
} from "mongoose";
import {
  ADULT_THEME_NAME,
  type IArticle,
  type IArticleArchive,
  type IArticleListItem,
  type IArticleType,
  type IGetAdminArticlesQuery,
  type IGetAdminArticlesResponse,
  type IGetArticleSlugsResponse,
  type IGetArticlesQuery,
  type IGetArticlesResponse,
  type ISaveArticleRequest,
} from "@mooncellar/schemas";
import { Game } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";
import { Article } from "../schemas/article.schema";
import { setPagination } from "../../../shared/pagination";
import { getS3CdnUrl } from "../../../shared/s3";
import { sanitizeRichText } from "../../../shared/utils/rich-text.utils";
import {
  escapeRegExp,
  toIsoString,
  toObjectId,
} from "../../collections/utils/collections.utils";
import {
  buildArticleArchive,
  countReadingMinutes,
  getPublishedRange,
  slugifyArticleTitle,
} from "../utils/articles.utils";

type IAggregatedArticle = Omit<Article, "content"> & {
  _id: mongoose.Types.ObjectId;
  content?: string;
  games?: {
    _id: mongoose.Types.ObjectId;
    slug: string;
    name: string;
    cover?: string | null;
    artwork?: string | null;
    first_release?: number | null;
    themes?: string[];
  }[];
  authors?: {
    _id: mongoose.Types.ObjectId;
    userName: string;
    avatar?: string;
  }[];
};

const PUBLISHED: FilterQuery<Article> = { status: "published" };

@Injectable()
export class ArticlesService {
  constructor(
    @InjectModel(Article.name) private readonly articleModel: Model<Article>,
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(User.name) private readonly userModel: Model<User>
  ) {}

  private presentationStages(): PipelineStage.FacetPipelineStage[] {
    return [
      {
        $lookup: {
          from: this.gameModel.collection.name,
          let: { gameId: "$gameId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$gameId"] } } },
            {
              $project: {
                slug: 1,
                name: 1,
                cover: 1,
                first_release: 1,
                themes: 1,
                artwork: {
                  $ifNull: [
                    { $first: "$artworks" },
                    { $first: "$screenshots" },
                  ],
                },
              },
            },
          ],
          as: "games",
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          let: { authorId: "$authorId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$authorId"] } } },
            { $project: { userName: 1, avatar: 1 } },
          ],
          as: "authors",
        },
      },
    ];
  }

  private toListItem(doc: IAggregatedArticle): IArticleListItem {
    const game = doc.games?.[0];
    const author = doc.authors?.[0];

    return {
      _id: doc._id.toString(),
      slug: doc.slug,
      type: doc.type,
      status: doc.status,
      title: doc.title,
      summary: doc.summary ?? "",
      image: doc.image ?? null,
      game: game
        ? {
            _id: game._id.toString(),
            slug: game.slug,
            name: game.name,
            cover: game.cover ?? null,
            artwork: game.artwork ?? null,
            year: game.first_release
              ? new Date(game.first_release * 1000).getUTCFullYear()
              : null,
            isAdult: !!game.themes?.includes(ADULT_THEME_NAME),
          }
        : null,
      author: author
        ? {
            _id: author._id.toString(),
            userName: author.userName,
            ...(author.avatar ? { avatar: author.avatar } : {}),
          }
        : null,
      readingMinutes: doc.readingMinutes ?? 1,
      publishedAt: doc.publishedAt ? toIsoString(doc.publishedAt) : null,
      createdAt: toIsoString(doc.createdAt),
      updatedAt: toIsoString(doc.updatedAt),
    };
  }

  private toArticle(doc: IAggregatedArticle): IArticle {
    return { ...this.toListItem(doc), content: doc.content ?? "" };
  }

  private async findOne(match: FilterQuery<Article>) {
    const [doc] = await this.articleModel.aggregate<IAggregatedArticle>([
      { $match: match },
      { $limit: 1 },
      ...this.presentationStages(),
    ]);

    return doc ? this.toArticle(doc) : null;
  }

  async getArticles(query: IGetArticlesQuery): Promise<IGetArticlesResponse> {
    const match: FilterQuery<Article> = { ...PUBLISHED };

    if (query.year)
      match.publishedAt = getPublishedRange(query.year, query.month);
    if (query.game) match.gameId = toObjectId(query.game, "game id");

    const typeMatch = query.type ? [{ $match: { type: query.type } }] : [];
    const [result] = await this.articleModel.aggregate<{
      counts: { _id: IArticleType; count: number }[];
      total: { count: number }[];
      results: IAggregatedArticle[];
    }>([
      { $match: match },
      {
        $facet: {
          counts: [{ $group: { _id: "$type", count: { $sum: 1 } } }],
          total: [...typeMatch, { $count: "count" }],
          results: [
            ...typeMatch,
            { $sort: { publishedAt: -1, _id: -1 } },
            ...(setPagination(
              query.page,
              query.take
            ) as PipelineStage.FacetPipelineStage[]),
            { $project: { content: 0 } },
            ...this.presentationStages(),
          ],
        },
      },
    ]);

    const countOf = (type: IArticleType) =>
      result?.counts.find((row) => row._id === type)?.count ?? 0;

    return {
      results: (result?.results ?? []).map((doc) => this.toListItem(doc)),
      total: result?.total[0]?.count ?? 0,
      counts: {
        all: countOf("news") + countOf("game"),
        news: countOf("news"),
        game: countOf("game"),
      },
    };
  }

  async getArchive(): Promise<IArticleArchive> {
    const rows = await this.articleModel.aggregate<{
      _id: { year: number; month: number };
      count: number;
    }>([
      { $match: { ...PUBLISHED, publishedAt: { $ne: null } } },
      {
        $group: {
          _id: {
            year: { $year: "$publishedAt" },
            month: { $month: "$publishedAt" },
          },
          count: { $sum: 1 },
        },
      },
    ]);

    return buildArticleArchive(
      rows.map((row) => ({
        year: row._id.year,
        month: row._id.month,
        count: row.count,
      }))
    );
  }

  async getSlugs(): Promise<IGetArticleSlugsResponse> {
    const docs = await this.articleModel
      .find(PUBLISHED)
      .select("slug updatedAt")
      .sort({ publishedAt: -1 })
      .lean();

    return docs.map((doc) => ({
      slug: doc.slug,
      updatedAt: toIsoString(doc.updatedAt),
    }));
  }

  async getBySlug(slug: string): Promise<IArticle> {
    const article = await this.findOne({ ...PUBLISHED, slug });

    if (!article) throw new NotFoundException("The post was not found");

    return article;
  }

  async getAdminArticles(
    query: IGetAdminArticlesQuery
  ): Promise<IGetAdminArticlesResponse> {
    const match: FilterQuery<Article> = query.status
      ? { status: query.status }
      : {};
    const [results, total] = await Promise.all([
      this.articleModel.aggregate<IAggregatedArticle>([
        { $match: match },
        { $sort: { updatedAt: -1, _id: -1 } },
        ...setPagination(query.page, query.take),
        { $project: { content: 0 } },
        ...this.presentationStages(),
      ]),
      this.articleModel.countDocuments(match),
    ]);

    return { results: results.map((doc) => this.toListItem(doc)), total };
  }

  async getAdminArticle(id: string): Promise<IArticle> {
    const article = await this.findOne({ _id: toObjectId(id, "post id") });

    if (!article) throw new NotFoundException("The post was not found");

    return article;
  }

  private async findFreeSlug(
    title: string,
    exceptId?: mongoose.Types.ObjectId
  ) {
    const base = slugifyArticleTitle(title);
    const taken = await this.articleModel
      .find({
        slug: { $regex: `^${escapeRegExp(base)}(-\\d+)?$` },
        ...(exceptId ? { _id: { $ne: exceptId } } : {}),
      })
      .select("slug")
      .lean();
    const used = new Set(taken.map((article) => article.slug));

    if (!used.has(base)) return base;

    let suffix = 2;

    while (used.has(`${base}-${suffix}`)) suffix += 1;

    return `${base}-${suffix}`;
  }

  private async prepare(dto: ISaveArticleRequest) {
    const content = sanitizeRichText(dto.content) ?? "";

    if (dto.status === "published" && !content) {
      throw new BadRequestException(
        "Write the text before publishing the post"
      );
    }

    if (dto.image && !dto.image.startsWith(`${getS3CdnUrl()}/`)) {
      throw new BadRequestException(
        "Upload the image to MoonCellar instead of linking it"
      );
    }

    const gameId =
      dto.type === "game" && dto.gameId
        ? toObjectId(dto.gameId, "game id")
        : null;

    if (dto.type === "game" && !gameId) {
      throw new BadRequestException("Pick the game this article is about");
    }

    if (gameId && !(await this.gameModel.exists({ _id: gameId }))) {
      throw new BadRequestException("The game was not found in the catalogue");
    }

    return {
      type: dto.type,
      status: dto.status,
      title: dto.title,
      summary: dto.summary,
      image: dto.image,
      content,
      gameId,
      readingMinutes: countReadingMinutes(content),
    };
  }

  async create(dto: ISaveArticleRequest, authorId: mongoose.Types.ObjectId) {
    const fields = await this.prepare(dto);
    const created = await this.articleModel.create({
      ...fields,
      slug: await this.findFreeSlug(dto.title),
      authorId,
      publishedAt: dto.status === "published" ? new Date() : null,
    });

    return this.getAdminArticle(created._id.toString());
  }

  async update(id: string, dto: ISaveArticleRequest) {
    const _id = toObjectId(id, "post id");
    const existing = await this.articleModel
      .findById(_id)
      .select("publishedAt slug")
      .lean();

    if (!existing) throw new NotFoundException("The post was not found");

    const fields = await this.prepare(dto);

    await this.articleModel.updateOne(
      { _id },
      {
        $set: {
          ...fields,
          slug: existing.publishedAt
            ? existing.slug
            : await this.findFreeSlug(dto.title, _id),
          publishedAt:
            existing.publishedAt ??
            (dto.status === "published" ? new Date() : null),
        },
      }
    );

    return this.getAdminArticle(id);
  }

  async remove(id: string) {
    const { deletedCount } = await this.articleModel.deleteOne({
      _id: toObjectId(id, "post id"),
    });

    if (!deletedCount) throw new NotFoundException("The post was not found");
  }
}
