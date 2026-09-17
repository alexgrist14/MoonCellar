import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, {
  type FilterQuery,
  type Model,
  type PipelineStage,
} from "mongoose";
import {
  CUSTOM_LIST_GAMES_MAX,
  CUSTOM_LIST_PREVIEW_COVERS,
  CUSTOM_LISTS_PER_USER_MAX,
  type IAddCustomListGameRequest,
  type ICreateCustomListRequest,
  type ICustomList,
  type ICustomListDetails,
  type ICustomListGameCountsResponse,
  type ICustomListLikeResponse,
  type IGetCustomListsQuery,
  type IGetCustomListsResponse,
  type IReorderCustomListRequest,
  type IUpdateCustomListRequest,
} from "@mooncellar/schemas";
import { Game } from "../../games/schemas/game.schema";
import { User } from "../../user/schemas/user.schema";
import { CustomList } from "../schemas/custom-list.schema";
import { CustomListLike } from "../schemas/custom-list-like.schema";
import type { ICollectionsViewer } from "../types/collections.type";
import {
  escapeRegExp,
  normalizeListName,
  toIsoString,
  toObjectId,
} from "../utils/collections.utils";
import { findFreeListSlug } from "../utils/list-slug.utils";

type IAggregatedList = Omit<CustomList, "games"> & {
  _id: mongoose.Types.ObjectId;
  games?: { gameId: mongoose.Types.ObjectId; addedAt: Date }[];
  previewIds?: mongoose.Types.ObjectId[];
  previewGames?: { _id: mongoose.Types.ObjectId; cover?: string | null }[];
  authorDocs?: {
    _id: mongoose.Types.ObjectId;
    userName: string;
    avatar?: string;
  }[];
  containsGame?: boolean;
};

const UPDATED_PERIOD_DAYS = { week: 7, month: 30, year: 365 } as const;
const DAY_MS = 86_400_000;
const POPULARITY_AGE_OFFSET_DAYS = 7;
const POPULARITY_GRAVITY = 0.8;

const isDuplicateKeyError = (error: unknown) =>
  (error as { code?: number } | null)?.code === 11000;

@Injectable()
export class CustomListsService {
  private readonly logger = new Logger(CustomListsService.name);

  constructor(
    @InjectModel(CustomList.name)
    private readonly listModel: Model<CustomList>,
    @InjectModel(User.name) private readonly userModel: Model<User>,
    @InjectModel(Game.name) private readonly gameModel: Model<Game>,
    @InjectModel(CustomListLike.name)
    private readonly likeModel: Model<CustomListLike>
  ) {}

  private async withViewerLikes<T extends ICustomList>(
    lists: T[],
    viewer: ICollectionsViewer
  ): Promise<T[]> {
    if (!viewer || !lists.length) return lists;

    const likes = await this.likeModel
      .find({
        userId: new mongoose.Types.ObjectId(viewer._id.toString()),
        listId: {
          $in: lists.map((list) => new mongoose.Types.ObjectId(list._id)),
        },
      })
      .select("listId")
      .lean();
    const liked = new Set(likes.map((like) => like.listId.toString()));

    return lists.map((list) => ({ ...list, isLiked: liked.has(list._id) }));
  }

  private isOwner(
    list: { userId: mongoose.Types.ObjectId },
    viewer: ICollectionsViewer
  ) {
    return !!viewer && list.userId.toString() === viewer._id.toString();
  }

  private presentationStages(
    gameId?: mongoose.Types.ObjectId
  ): PipelineStage[] {
    return [
      {
        $addFields: {
          previewIds: {
            $slice: [
              { $ifNull: ["$games.gameId", []] },
              CUSTOM_LIST_PREVIEW_COVERS,
            ],
          },
          ...(gameId
            ? {
                containsGame: {
                  $in: [gameId, { $ifNull: ["$games.gameId", []] }],
                },
              }
            : {}),
        },
      },
      {
        $lookup: {
          from: this.gameModel.collection.name,
          let: { ids: "$previewIds" },
          pipeline: [
            { $match: { $expr: { $in: ["$_id", "$$ids"] } } },
            { $project: { cover: 1 } },
          ],
          as: "previewGames",
        },
      },
      {
        $lookup: {
          from: this.userModel.collection.name,
          let: { ownerId: "$userId" },
          pipeline: [
            { $match: { $expr: { $eq: ["$_id", "$$ownerId"] } } },
            { $project: { userName: 1, avatar: 1 } },
          ],
          as: "authorDocs",
        },
      },
    ];
  }

  private toList(doc: IAggregatedList): ICustomList {
    const covers = (doc.previewIds ?? [])
      .map(
        (id) =>
          doc.previewGames?.find(
            (game) => game._id.toString() === id.toString()
          )?.cover
      )
      .filter((cover): cover is string => !!cover);
    const author = doc.authorDocs?.[0];

    return {
      _id: doc._id.toString(),
      userId: doc.userId.toString(),
      name: doc.name,
      slug: doc.slug,
      description: doc.description ?? "",
      isPrivate: !!doc.isPrivate,
      gamesCount: doc.gamesCount ?? 0,
      likesCount: Math.max(doc.likesCount ?? 0, 0),
      covers,
      author: author
        ? {
            _id: author._id.toString(),
            userName: author.userName,
            ...(author.avatar ? { avatar: author.avatar } : {}),
          }
        : null,
      ...(doc.containsGame !== undefined
        ? { containsGame: !!doc.containsGame }
        : {}),
      createdAt: toIsoString(doc.createdAt),
      updatedAt: toIsoString(doc.updatedAt),
    };
  }

  private async findPresented(
    match: FilterQuery<CustomList>,
    gameId?: mongoose.Types.ObjectId
  ) {
    const [doc] = await this.listModel.aggregate<IAggregatedList>([
      { $match: match },
      { $limit: 1 },
      ...this.presentationStages(gameId),
    ]);

    return doc;
  }

  private async getOwnedList(id: string, viewer: ICollectionsViewer) {
    const list = await this.listModel.findById(toObjectId(id, "list id"));

    if (!list) throw new NotFoundException("List not found");
    if (!this.isOwner(list, viewer)) {
      throw new ForbiddenException("Only the owner can change this list");
    }

    return list;
  }

  private async assertGameExists(gameId: mongoose.Types.ObjectId) {
    const exists = await this.gameModel.exists({ _id: gameId });

    if (!exists) throw new NotFoundException("Game not found");
  }

  private async assertNameIsFree(
    userId: mongoose.Types.ObjectId,
    name: string,
    exceptId?: mongoose.Types.ObjectId
  ) {
    const clash = await this.listModel.exists({
      userId,
      nameNormalized: normalizeListName(name),
      ...(exceptId ? { _id: { $ne: exceptId } } : {}),
    });

    if (clash) {
      throw new ConflictException("You already have a list with this name");
    }
  }

  private getFreeSlug(
    userId: mongoose.Types.ObjectId,
    name: string,
    exceptId?: mongoose.Types.ObjectId
  ) {
    return findFreeListSlug(this.listModel, userId, name, exceptId);
  }

  async getLists(
    query: IGetCustomListsQuery,
    viewer: ICollectionsViewer
  ): Promise<IGetCustomListsResponse> {
    try {
      const match: FilterQuery<CustomList> = {
        isPrivate: false,
        gamesCount: { $gte: query.minGames ?? 1 },
      };
      const search = query.search?.trim();

      if (query.author?.trim()) {
        const authors = await this.userModel
          .find({
            userName: {
              $regex: `^${escapeRegExp(query.author.trim())}`,
              $options: "i",
            },
          })
          .select("_id")
          .limit(100)
          .lean();

        if (!authors.length) return { results: [], total: 0 };

        match.userId = { $in: authors.map((author) => author._id) };
      }

      if (search) {
        const pattern = escapeRegExp(search);

        match.$or = [
          { name: { $regex: pattern, $options: "i" } },
          { description: { $regex: pattern, $options: "i" } },
        ];
      }

      if (query.games?.length) {
        const ids = query.games.map((id) => toObjectId(id, "game id"));

        match["games.gameId"] =
          query.gamesMode === "all" ? { $all: ids } : { $in: ids };
      }

      if (query.updated) {
        match.updatedAt = {
          $gte: new Date(
            Date.now() - UPDATED_PERIOD_DAYS[query.updated] * 86_400_000
          ),
        };
      }

      const direction = query.sortOrder === "asc" ? 1 : -1;
      const isPopular = query.sortBy === "popular";
      const sortField =
        query.sortBy === "name"
          ? "nameNormalized"
          : isPopular
            ? "popularity"
            : query.sortBy;
      const sort: Record<string, 1 | -1> = {
        ...(search ? { nameMatch: -1 } : {}),
        [sortField]: direction,
        ...(isPopular ? { updatedAt: -1 } : {}),
        _id: -1,
      };

      const [docs, total] = await Promise.all([
        this.listModel.aggregate<IAggregatedList>([
          { $match: match },
          ...(search
            ? [
                {
                  $addFields: {
                    nameMatch: {
                      $regexMatch: {
                        input: "$name",
                        regex: escapeRegExp(search),
                        options: "i",
                      },
                    },
                  },
                },
              ]
            : []),
          ...(isPopular
            ? [
                {
                  $addFields: {
                    popularity: {
                      $divide: [
                        { $ifNull: ["$likesCount", 0] },
                        {
                          $pow: [
                            {
                              $add: [
                                {
                                  $divide: [
                                    { $subtract: ["$$NOW", "$createdAt"] },
                                    DAY_MS,
                                  ],
                                },
                                POPULARITY_AGE_OFFSET_DAYS,
                              ],
                            },
                            POPULARITY_GRAVITY,
                          ],
                        },
                      ],
                    },
                  },
                },
              ]
            : []),
          { $sort: sort },
          { $skip: (query.page - 1) * query.take },
          { $limit: query.take },
          ...this.presentationStages(),
          { $project: { games: 0 } },
        ]),
        this.listModel.countDocuments(match),
      ]);

      return {
        results: await this.withViewerLikes(
          docs.map((doc) => this.toList(doc)),
          viewer
        ),
        total,
      };
    } catch (err) {
      this.logger.error(err, "Failed to get custom lists");
      throw err;
    }
  }

  async getUserLists(
    userId: string,
    viewer: ICollectionsViewer,
    gameId?: string
  ): Promise<ICustomList[]> {
    const ownerId = toObjectId(userId, "user id");
    const isOwner = !!viewer && viewer._id.toString() === ownerId.toString();

    try {
      const docs = await this.listModel.aggregate<IAggregatedList>([
        {
          $match: { userId: ownerId, ...(isOwner ? {} : { isPrivate: false }) },
        },
        { $sort: { updatedAt: -1, _id: -1 } },
        ...this.presentationStages(
          gameId ? toObjectId(gameId, "game id") : undefined
        ),
        { $project: { games: 0 } },
      ]);

      return await this.withViewerLikes(
        docs.map((doc) => this.toList(doc)),
        viewer
      );
    } catch (err) {
      this.logger.error(err, `Failed to get lists of user: ${userId}`);
      throw err;
    }
  }

  async getLikedLists(
    userId: string,
    viewer: ICollectionsViewer
  ): Promise<ICustomList[]> {
    const likerId = toObjectId(userId, "user id");

    try {
      const likes = await this.likeModel
        .find({ userId: likerId })
        .sort({ createdAt: -1, _id: -1 })
        .select("listId")
        .lean();

      if (!likes.length) return [];

      const order = new Map(
        likes.map((like, index) => [like.listId.toString(), index])
      );
      const docs = await this.listModel.aggregate<IAggregatedList>([
        {
          $match: {
            _id: { $in: likes.map((like) => like.listId) },
            isPrivate: false,
          },
        },
        ...this.presentationStages(),
        { $project: { games: 0 } },
      ]);

      const lists = docs
        .map((doc) => this.toList(doc))
        .sort(
          (a, b) =>
            (order.get(a._id) ?? Infinity) - (order.get(b._id) ?? Infinity)
        );

      return await this.withViewerLikes(lists, viewer);
    } catch (err) {
      this.logger.error(err, `Failed to get lists liked by user: ${userId}`);
      throw err;
    }
  }

  async getGameCounts(viewer: User): Promise<ICustomListGameCountsResponse> {
    try {
      const rows = await this.listModel.aggregate<{
        _id: mongoose.Types.ObjectId;
        count: number;
      }>([
        {
          $match: {
            userId: new mongoose.Types.ObjectId(viewer._id.toString()),
          },
        },
        { $unwind: "$games" },
        { $group: { _id: "$games.gameId", count: { $sum: 1 } } },
      ]);

      return Object.fromEntries(
        rows.map((row) => [row._id.toString(), row.count])
      );
    } catch (err) {
      this.logger.error(err, `Failed to count listed games: ${viewer._id}`);
      throw err;
    }
  }

  async getBySlug(
    userName: string,
    slug: string,
    viewer: ICollectionsViewer
  ): Promise<ICustomListDetails> {
    const owner = await this.userModel
      .findOne({ userName })
      .select("_id")
      .lean();

    if (!owner) throw new NotFoundException("List not found");

    const doc = await this.findPresented({
      userId: owner._id,
      $or: [{ slug }, { previousSlugs: slug }],
    });

    if (!doc || (doc.isPrivate && !this.isOwner(doc, viewer))) {
      throw new NotFoundException("List not found");
    }

    const [list] = await this.withViewerLikes([this.toList(doc)], viewer);

    return {
      ...list,
      games: (doc.games ?? []).map((game) => ({
        gameId: game.gameId.toString(),
        addedAt: toIsoString(game.addedAt),
      })),
    };
  }

  async createList(
    dto: ICreateCustomListRequest,
    viewer: User
  ): Promise<ICustomList> {
    const userId = new mongoose.Types.ObjectId(viewer._id.toString());
    const count = await this.listModel.countDocuments({ userId });

    if (count >= CUSTOM_LISTS_PER_USER_MAX) {
      throw new BadRequestException(
        `You can have up to ${CUSTOM_LISTS_PER_USER_MAX} lists`
      );
    }

    await this.assertNameIsFree(userId, dto.name);

    const gameId = dto.gameId ? toObjectId(dto.gameId, "game id") : undefined;

    if (gameId) await this.assertGameExists(gameId);

    try {
      const list = await this.listModel.create({
        userId,
        name: dto.name.trim(),
        nameNormalized: normalizeListName(dto.name),
        slug: await this.getFreeSlug(userId, dto.name),
        description: dto.description?.trim() ?? "",
        isPrivate: !!dto.isPrivate,
        games: gameId ? [{ gameId, addedAt: new Date() }] : [],
        gamesCount: gameId ? 1 : 0,
      });

      return this.toList(await this.findPresented({ _id: list._id }));
    } catch (err) {
      this.logger.error(err, `Failed to create list for: ${viewer._id}`);
      throw err;
    }
  }

  async updateList(
    id: string,
    dto: IUpdateCustomListRequest,
    viewer: User
  ): Promise<ICustomList> {
    const list = await this.getOwnedList(id, viewer);

    if (
      dto.name !== undefined &&
      normalizeListName(dto.name) !== list.nameNormalized
    ) {
      await this.assertNameIsFree(list.userId, dto.name, list._id);
    }

    try {
      if (dto.name !== undefined && dto.name.trim() !== list.name) {
        const nextSlug = await this.getFreeSlug(
          list.userId,
          dto.name,
          list._id
        );

        if (nextSlug !== list.slug) {
          list.previousSlugs = [
            ...new Set([...(list.previousSlugs ?? []), list.slug]),
          ].filter((slug) => slug !== nextSlug);
          list.slug = nextSlug;
        }

        list.name = dto.name.trim();
        list.nameNormalized = normalizeListName(dto.name);
      }

      if (dto.description !== undefined) {
        list.description = dto.description.trim();
      }

      if (dto.isPrivate !== undefined) {
        list.isPrivate = dto.isPrivate;
      }

      await list.save();

      return this.toList(await this.findPresented({ _id: list._id }));
    } catch (err) {
      this.logger.error(err, `Failed to update list: ${id}`);
      throw err;
    }
  }

  async deleteList(id: string, viewer: User) {
    const list = await this.getOwnedList(id, viewer);

    try {
      await this.listModel.deleteOne({ _id: list._id });
      await this.likeModel.deleteMany({ listId: list._id });

      return { _id: list._id.toString() };
    } catch (err) {
      this.logger.error(err, `Failed to delete list: ${id}`);
      throw err;
    }
  }

  async setLike(
    id: string,
    viewer: User,
    isLiked: boolean
  ): Promise<ICustomListLikeResponse> {
    const list = await this.listModel
      .findById(toObjectId(id, "list id"))
      .select("userId isPrivate likesCount")
      .lean();

    if (!list || list.isPrivate) {
      throw new NotFoundException("List not found");
    }

    if (this.isOwner(list, viewer)) {
      throw new BadRequestException("You can't like your own list");
    }

    const key = {
      listId: list._id,
      userId: new mongoose.Types.ObjectId(viewer._id.toString()),
    };

    try {
      let isChanged: boolean;

      if (isLiked) {
        try {
          const { upsertedCount } = await this.likeModel.updateOne(
            key,
            { $setOnInsert: key },
            { upsert: true }
          );

          isChanged = upsertedCount > 0;
        } catch (error) {
          if (!isDuplicateKeyError(error)) throw error;

          isChanged = false;
        }
      } else {
        const { deletedCount } = await this.likeModel.deleteOne(key);

        isChanged = deletedCount > 0;
      }

      const updated = isChanged
        ? await this.listModel
            .findByIdAndUpdate(
              list._id,
              { $inc: { likesCount: isLiked ? 1 : -1 } },
              { new: true, timestamps: false, projection: { likesCount: 1 } }
            )
            .lean()
        : list;

      return {
        likesCount: Math.max(updated?.likesCount ?? 0, 0),
        isLiked,
      };
    } catch (err) {
      this.logger.error(err, `Failed to set like on list: ${id}`);
      throw err;
    }
  }

  async addGame(
    id: string,
    dto: IAddCustomListGameRequest,
    viewer: User
  ): Promise<ICustomList> {
    const list = await this.getOwnedList(id, viewer);
    const gameId = toObjectId(dto.gameId, "game id");

    if (list.games.some((game) => game.gameId.equals(gameId))) {
      throw new ConflictException("The game is already in this list");
    }

    if (list.games.length >= CUSTOM_LIST_GAMES_MAX) {
      throw new BadRequestException(
        `A list can hold up to ${CUSTOM_LIST_GAMES_MAX} games`
      );
    }

    await this.assertGameExists(gameId);

    try {
      const entry = { gameId, addedAt: new Date() };

      list.games =
        dto.position === "start"
          ? [entry, ...list.games]
          : [...list.games, entry];
      list.gamesCount = list.games.length;
      await list.save();

      return this.toList(await this.findPresented({ _id: list._id }));
    } catch (err) {
      this.logger.error(err, `Failed to add game to list: ${id}`);
      throw err;
    }
  }

  async removeGame(
    id: string,
    gameId: string,
    viewer: User
  ): Promise<ICustomList> {
    const list = await this.getOwnedList(id, viewer);
    const objectId = toObjectId(gameId, "game id");
    const games = list.games.filter((game) => !game.gameId.equals(objectId));

    if (games.length === list.games.length) {
      throw new NotFoundException("The game is not in this list");
    }

    try {
      list.games = games;
      list.gamesCount = games.length;
      await list.save();

      return this.toList(await this.findPresented({ _id: list._id }));
    } catch (err) {
      this.logger.error(err, `Failed to remove game from list: ${id}`);
      throw err;
    }
  }

  async reorderGames(
    id: string,
    dto: IReorderCustomListRequest,
    viewer: User
  ): Promise<ICustomList> {
    const list = await this.getOwnedList(id, viewer);
    const byId = new Map(
      list.games.map((game) => [game.gameId.toString(), game])
    );
    const isSameSet =
      dto.gameIds.length === list.games.length &&
      new Set(dto.gameIds).size === dto.gameIds.length &&
      dto.gameIds.every((gameId) => byId.has(gameId));

    if (!isSameSet) {
      throw new BadRequestException(
        "The order must contain exactly the games in the list"
      );
    }

    try {
      list.games = dto.gameIds.map((gameId) => byId.get(gameId)!);
      await list.save();

      return this.toList(await this.findPresented({ _id: list._id }));
    } catch (err) {
      this.logger.error(err, `Failed to reorder list: ${id}`);
      throw err;
    }
  }
}
