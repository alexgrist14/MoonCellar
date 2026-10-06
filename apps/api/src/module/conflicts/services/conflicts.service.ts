import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model, Types } from "mongoose";
import {
  ConflictSourceSchema,
  type IConflictItem,
  type IConflictSource,
  type IConflictState,
  type IConflictsResponse,
  type IConflictsSummary,
  type IGameConflict,
  type IGetConflictsParams,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import type { User } from "../../user/schemas/user.schema";
import {
  Conflict,
  type ConflictDocument,
  type IConflictCandidateEntry,
} from "../schemas/conflict.schema";
import { ConflictsGateway } from "../gateways/conflicts.gateway";
import type {
  IConflictRecord,
  IConflictSourceHandler,
} from "../types/conflicts.types";

const APPLY_BATCH_SIZE = 100;

const UNDECIDED_FILTER = { status: "pending", decision: null } as const;

const STATE_FILTERS: Record<IConflictState, object> = {
  waiting: UNDECIDED_FILTER,
  "queued-match": { status: "pending", decision: "match" },
  "queued-new": { status: "pending", decision: "skip" },
  matched: { status: "resolved" },
  "new-game": { status: "absent" },
  postponed: { status: "postponed" },
  dismissed: { status: "dismissed" },
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const conflictState = ({
  status,
  decision,
}: Pick<Conflict, "status" | "decision">): IConflictState =>
  status === "resolved"
    ? "matched"
    : status === "absent"
      ? "new-game"
      : status === "postponed" || status === "dismissed"
        ? status
        : decision === "match"
          ? "queued-match"
          : decision === "skip"
            ? "queued-new"
            : "waiting";

const winnerIds = ({
  winner,
  winners,
}: Pick<Conflict, "winner" | "winners">): Types.ObjectId[] =>
  winners?.length ? winners : winner ? [winner] : [];

const toCandidateEntry = (
  candidate: IConflictRecord["candidates"][number]
) => ({
  gameId: new Types.ObjectId(candidate.game._id),
  slug: candidate.game.slug,
  name: candidate.game.name,
  score: candidate.score,
  breakdown: candidate.breakdown,
  dateSignal: candidate.dateSignal,
  descriptionSignal: candidate.descriptionSignal,
  hasCompanyMismatch: candidate.hasCompanyMismatch,
  matchedTitle: candidate.matchedTitle ?? null,
});

const readPath = (value: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      value
    );

@Injectable()
export class ConflictsService {
  private readonly logger = new Logger(ConflictsService.name);
  private readonly handlers = new Map<
    IConflictSource,
    IConflictSourceHandler
  >();
  private readonly applying = new Set<IConflictSource>();
  private readonly hasNewDecisions = new Set<IConflictSource>();

  constructor(
    @InjectModel(Conflict.name)
    private readonly conflictsModel: Model<Conflict>,
    @InjectModel(Game.name) private readonly gamesModel: Model<GameDocument>,
    private readonly events: ConflictsGateway
  ) {}

  register(handler: IConflictSourceHandler) {
    this.handlers.set(handler.source, handler);
  }

  async record(source: IConflictSource, records: IConflictRecord[]) {
    if (!records.length) return;

    try {
      await this.conflictsModel.insertMany(
        records.map(
          ({
            externalId,
            externalName,
            externalData,
            reason,
            candidates,
            entries,
          }) => ({
            source,
            externalId,
            externalName,
            externalData: externalData ?? null,
            reason,
            entries: entries ?? [],
            candidates: candidates.map(toCandidateEntry),
            status: "pending",
            winner: null,
          })
        ),
        { ordered: false }
      );
    } catch (error) {
      if ((error as { code?: number }).code !== 11000) throw error;
    }
  }

  async setExternalData(
    source: IConflictSource,
    items: { externalId: string; externalData: Record<string, unknown> }[]
  ) {
    if (!items.length) return;

    await this.conflictsModel.bulkWrite(
      items.map(({ externalId, externalData }) => ({
        updateOne: {
          filter: { source, externalId },
          update: { $set: { externalData } },
        },
      })),
      { ordered: false }
    );
  }

  async getForGame(gameId: string): Promise<IGameConflict[]> {
    if (!Types.ObjectId.isValid(gameId)) {
      throw new BadRequestException(`Invalid game id: ${gameId}`);
    }

    const conflicts = await this.conflictsModel
      .find({
        ...UNDECIDED_FILTER,
        $or: [
          { "candidates.gameId": new Types.ObjectId(gameId) },
          { source: "hltb", externalId: gameId },
        ],
      })
      .select("source externalId externalName")
      .sort({ _id: 1 })
      .lean();

    return conflicts.map(({ source, externalId, externalName }) => ({
      source,
      externalId,
      externalName: externalName ?? externalId,
    }));
  }

  async findUndecided(
    source: IConflictSource,
    {
      limit,
      unverifiedOnly,
      dueBefore,
    }: { limit: number; unverifiedOnly?: boolean; dueBefore?: Date }
  ) {
    return this.conflictsModel
      .find({
        source,
        $or: [
          {
            ...UNDECIDED_FILTER,
            ...(unverifiedOnly && {
              "externalData.verifiedAt": { $exists: false },
            }),
          },
          ...(dueBefore
            ? [
                {
                  status: "postponed",
                  "externalData.recheckAfter": {
                    $lte: dueBefore.toISOString(),
                  },
                },
              ]
            : []),
        ],
      })
      .select("externalId externalData candidates.gameId")
      .sort({ _id: 1 })
      .limit(limit)
      .lean();
  }

  async setStatus(
    source: IConflictSource,
    externalIds: string[],
    status: "pending" | "postponed" | "dismissed"
  ) {
    if (!externalIds.length) return 0;

    const { modifiedCount } = await this.conflictsModel.updateMany(
      {
        source,
        externalId: { $in: externalIds },
        status: { $in: ["pending", "postponed", "dismissed"] },
        decision: null,
      },
      { $set: { status } }
    );

    return modifiedCount;
  }

  async dismissUndecided(source: IConflictSource, externalIds: string[]) {
    if (!externalIds.length) return 0;

    const { deletedCount } = await this.conflictsModel.deleteMany({
      source,
      externalId: { $in: externalIds },
      status: { $in: ["pending", "postponed", "dismissed"] },
      decision: null,
    });

    return deletedCount;
  }

  async removeForGame(
    source: IConflictSource,
    gameId: Types.ObjectId,
    {
      externalIds = [],
      keepExternalIds = [],
    }: { externalIds?: string[]; keepExternalIds?: string[] } = {}
  ) {
    const { deletedCount } = await this.conflictsModel.deleteMany({
      source,
      externalId: { $nin: keepExternalIds },
      $or: [
        { externalId: { $in: externalIds } },
        { "candidates.gameId": gameId, status: "pending", decision: null },
      ],
    });

    return deletedCount;
  }

  async getResolutions(source: IConflictSource) {
    const conflicts = await this.conflictsModel
      .find({ source })
      .select("externalId status winner winners")
      .lean();

    return new Map(
      conflicts.map((conflict) => [
        conflict.externalId,
        { status: conflict.status, winners: winnerIds(conflict) },
      ])
    );
  }

  async pin(
    source: IConflictSource,
    externalIds: string[],
    gameId: Types.ObjectId
  ) {
    const handler = this.getHandler(source);

    for (const externalId of externalIds) {
      const existing = await this.conflictsModel
        .findOne({ source, externalId })
        .select("externalData")
        .lean();
      const subject = await handler.describe(
        externalId,
        existing?.externalData ?? null
      );

      await this.conflictsModel.updateOne(
        { source, externalId },
        [
          {
            $set: {
              externalName: {
                $ifNull: ["$externalName", subject?.name ?? externalId],
              },
              candidates: { $ifNull: ["$candidates", []] },
              entries: { $ifNull: ["$entries", []] },
              status: "resolved",
              decision: null,
              winnerEntryId: null,
              winner: { $ifNull: ["$winner", gameId] },
              winners: {
                $setUnion: [
                  { $ifNull: ["$winners", []] },
                  {
                    $cond: [
                      { $eq: [{ $type: "$winner" }, "objectId"] },
                      ["$winner"],
                      [],
                    ],
                  },
                  [gameId],
                ],
              },
            },
          },
        ],
        { upsert: true }
      );
    }
  }

  count(source: IConflictSource) {
    return this.conflictsModel.countDocuments({ source });
  }

  async getMaxExternalNumber(source: IConflictSource, prefix = "") {
    const [result] = await this.conflictsModel.aggregate<{ max: number }>([
      {
        $match: {
          source,
          externalId: { $regex: new RegExp(`^${escapeRegExp(prefix)}\\d+$`) },
        },
      },
      {
        $group: {
          _id: null,
          max: {
            $max: {
              $toInt: { $substrCP: ["$externalId", prefix.length, 20] },
            },
          },
        },
      },
    ]);

    return result?.max ?? 0;
  }

  async getList({
    page,
    take,
    search,
    source,
    state,
  }: IGetConflictsParams): Promise<IConflictsResponse> {
    const filter = {
      ...(source ? { source } : {}),
      ...(state ? STATE_FILTERS[state] : {}),
      ...(search
        ? {
            $or: [
              { externalName: new RegExp(escapeRegExp(search), "i") },
              { "candidates.name": new RegExp(escapeRegExp(search), "i") },
            ],
          }
        : {}),
    };

    const [total, rows] = await Promise.all([
      this.conflictsModel.countDocuments(filter),
      this.conflictsModel.aggregate<ConflictDocument>([
        { $match: filter },
        {
          $addFields: {
            isWaiting: {
              $and: [
                { $eq: ["$status", "pending"] },
                { $eq: [{ $ifNull: ["$decision", null] }, null] },
              ],
            },
          },
        },
        { $sort: { isWaiting: -1, _id: 1 } },
        { $skip: (page - 1) * take },
        { $limit: take },
      ]),
    ]);

    const winners = await this.gamesModel
      .find({ _id: { $in: rows.flatMap(winnerIds) } })
      .select("name slug")
      .lean();
    const winnerById = new Map(winners.map((game) => [String(game._id), game]));

    return {
      total,
      results: rows.map((row) => ({
        source: row.source,
        direction: this.handlers.get(row.source)?.direction ?? "games",
        externalId: row.externalId,
        externalName: row.externalName,
        reason: row.reason ?? null,
        state: conflictState(row),
        candidates: (row.candidates ?? []).map(
          ({ gameId, name, slug, score }) => ({
            gameId: String(gameId),
            name,
            slug,
            score,
          })
        ),
        entries: (row.entries ?? []).map(({ id, name }) => ({ id, name })),
        winners: winnerIds(row).flatMap((id) => {
          const game = winnerById.get(String(id));

          return game
            ? [{ _id: String(game._id), name: game.name, slug: game.slug }]
            : [];
        }),
      })),
    };
  }

  async getSummary(source?: IConflictSource): Promise<IConflictsSummary> {
    const sourceFilter = source ? { source } : {};
    const [pending, applying, first, perSource] = await Promise.all([
      this.conflictsModel.countDocuments({
        ...sourceFilter,
        ...UNDECIDED_FILTER,
      }),
      this.conflictsModel.countDocuments({
        ...sourceFilter,
        status: "pending",
        decision: { $ne: null },
      }),
      this.conflictsModel
        .findOne({ ...sourceFilter, ...UNDECIDED_FILTER })
        .sort({ _id: 1 })
        .select("source externalId")
        .lean(),
      this.conflictsModel.aggregate<{ _id: IConflictSource; count: number }>([
        { $match: UNDECIDED_FILTER },
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]),
    ]);

    if (applying) {
      const queued = await this.conflictsModel.distinct("source", {
        ...sourceFilter,
        status: "pending",
        decision: { $ne: null },
      });

      queued.forEach((queuedSource) => this.startApplying(queuedSource));
    }

    return {
      pending,
      applying,
      firstExternalId: first?.externalId ?? null,
      firstSource: first?.source ?? null,
      bySource: Object.fromEntries(
        ConflictSourceSchema.options.map((name) => [
          name,
          perSource.find(({ _id }) => _id === name)?.count ?? 0,
        ])
      ) as IConflictsSummary["bySource"],
    };
  }

  async getItem(
    source: IConflictSource,
    externalId: string
  ): Promise<IConflictItem | null> {
    const handler = this.getHandler(source);
    const conflict = await this.conflictsModel
      .findOne({ source, externalId })
      .lean();

    if (!conflict) return null;

    const undecided = { source, ...UNDECIDED_FILTER };
    const [remaining, next, games, subject] = await Promise.all([
      this.conflictsModel.countDocuments({
        ...undecided,
        _id: { $gte: conflict._id },
      }),
      this.conflictsModel
        .findOne({ ...undecided, _id: { $gt: conflict._id } })
        .sort({ _id: 1 })
        .select("externalId")
        .lean(),
      this.gamesModel
        .find({
          _id: { $in: conflict.candidates.map(({ gameId }) => gameId) },
        })
        .select(
          `cover type summary alternative_names companies first_release platformIds isCustom ${handler.linkField}`
        )
        .lean(),
      handler.describe(externalId, conflict.externalData ?? null),
    ]);

    const gameById = new Map(games.map((game) => [String(game._id), game]));

    return {
      id: String(conflict._id),
      source,
      direction: handler.direction,
      isMultiMatch: !!handler.isMultiMatch,
      externalId,
      reason: conflict.reason ?? null,
      state: conflictState(conflict),
      remaining,
      nextExternalId: next?.externalId ?? null,
      decidedBy: conflict.decidedBy?.userName ?? null,
      subject,
      candidates: conflict.candidates.map((entry) => {
        const game = gameById.get(String(entry.gameId));
        const linked = game ? readPath(game, handler.linkField) : null;

        return {
          gameId: String(entry.gameId),
          slug: entry.slug,
          name: entry.name,
          score: entry.score,
          breakdown: entry.breakdown,
          dateSignal: entry.dateSignal,
          descriptionSignal: entry.descriptionSignal,
          hasCompanyMismatch: entry.hasCompanyMismatch,
          matchedTitle: entry.matchedTitle ?? null,
          isManual: !!entry.isManual,
          game: game
            ? {
                cover: game.cover ?? null,
                type: game.type ?? null,
                summary: game.summary ?? null,
                alternativeNames: game.alternative_names ?? [],
                companies: game.companies ?? [],
                firstRelease: game.first_release ?? null,
                platformIds: (game.platformIds ?? []).map(String),
                isCustom: !!game.isCustom,
                linkedExternalId: linked == null ? null : String(linked),
              }
            : null,
        };
      }),
      entries: conflict.entries ?? [],
    };
  }

  async decide(
    source: IConflictSource,
    externalId: string,
    choice: {
      gameId?: string | null;
      gameIds?: string[];
      entryId?: string | null;
    },
    user: Pick<User, "_id" | "userName">
  ): Promise<IConflictsSummary> {
    const { direction, isMultiMatch } = this.getHandler(source);
    const gameIds =
      direction !== "games"
        ? []
        : [
            ...new Set(
              choice.gameIds ?? (choice.gameId ? [choice.gameId] : [])
            ),
          ];

    if (gameIds.length > 1 && !isMultiMatch) {
      throw new BadRequestException(
        `A ${source} entry can only be linked to one game`
      );
    }

    const winners = gameIds.map((id) => new Types.ObjectId(id));
    const entryId = direction === "entries" ? (choice.entryId ?? null) : null;
    const isMatch = !!(winners.length || entryId);

    const conflict = await this.conflictsModel
      .findOneAndUpdate(
        {
          source,
          externalId,
          status: { $in: ["pending", "postponed", "dismissed"] },
          decision: null,
          ...(winners.length ? { "candidates.gameId": { $all: winners } } : {}),
          ...(entryId ? { "entries.id": entryId } : {}),
        },
        {
          $set: {
            status: "pending",
            decision: isMatch ? "match" : "skip",
            winner: winners[0] ?? null,
            winners,
            winnerEntryId: entryId,
            decidedBy: {
              userId: new Types.ObjectId(String(user._id)),
              userName: user.userName,
            },
          },
        },
        { new: true }
      )
      .select("status decision")
      .lean();

    if (!conflict) throw await this.getDecisionError(source, externalId);

    this.events.conflictDecided({
      source,
      externalId,
      state: conflictState(conflict),
      decidedBy: user.userName,
    });
    this.startApplying(source);

    return this.getSummary(source);
  }

  async addCandidate(
    source: IConflictSource,
    externalId: string,
    gameId: string
  ): Promise<void> {
    if (this.getHandler(source).direction !== "games") {
      throw new BadRequestException(
        `${source} conflicts list source entries, not games`
      );
    }

    const game = await this.gamesModel
      .findById(gameId)
      .select("name slug")
      .lean();

    if (!game) throw new NotFoundException(`Game ${gameId} does not exist`);

    const candidate: IConflictCandidateEntry = {
      gameId: game._id,
      slug: game.slug,
      name: game.name,
      score: 0,
      breakdown: {
        title: 0,
        companies: 0,
        date: 0,
        platforms: 0,
        genre: 0,
        type: 0,
      },
      dateSignal: "unknown",
      descriptionSignal: "unknown",
      hasCompanyMismatch: false,
      matchedTitle: null,
      isManual: true,
    };

    const conflict = await this.conflictsModel.findOneAndUpdate(
      {
        source,
        externalId,
        ...UNDECIDED_FILTER,
        "candidates.gameId": { $ne: game._id },
      },
      { $push: { candidates: { $each: [candidate], $position: 0 } } }
    );

    if (!conflict) {
      const existing = await this.conflictsModel
        .findOne({ source, externalId, "candidates.gameId": game._id })
        .select("_id")
        .lean();

      throw existing
        ? new ConflictException(`${game.name} is already a candidate`)
        : await this.getDecisionError(source, externalId);
    }
  }

  async reopen(
    source: IConflictSource,
    externalId: string,
    user: Pick<User, "_id" | "userName">
  ): Promise<IConflictsSummary> {
    const handler = this.getHandler(source);

    if (!handler.rematch) {
      throw new BadRequestException(`${source} conflicts cannot be reopened`);
    }

    const existing = await this.conflictsModel
      .findOne({ source, externalId })
      .select("externalData")
      .lean();
    const candidates = await handler.rematch(
      externalId,
      existing?.externalData ?? null
    );

    if (!candidates) {
      throw new NotFoundException(`${source} ${externalId} no longer exists`);
    }

    const conflict = await this.conflictsModel.findOneAndUpdate(
      { source, externalId, status: "absent", decision: null },
      {
        $set: {
          status: "pending",
          candidates: candidates.map(toCandidateEntry),
          winner: null,
          winners: [],
          winnerEntryId: null,
          decision: null,
          decidedBy: null,
        },
      }
    );

    if (!conflict) {
      throw new ConflictException(
        `${externalId} is not a skipped ${source} conflict`
      );
    }

    this.events.conflictDecided({
      source,
      externalId,
      state: "waiting",
      decidedBy: user.userName,
    });

    return this.getSummary(source);
  }

  private getHandler(source: IConflictSource) {
    const handler = this.handlers.get(source);

    if (!handler) {
      throw new BadRequestException(`No conflict handler for ${source}`);
    }

    return handler;
  }

  private async getDecisionError(source: IConflictSource, externalId: string) {
    const conflict = await this.conflictsModel
      .findOne({ source, externalId })
      .select("status decision decidedBy")
      .lean();

    if (!conflict) {
      return new NotFoundException(
        `${source} ${externalId} is not in the conflicts queue`
      );
    }

    if (conflictState(conflict) !== "waiting") {
      return new ConflictException(
        `${conflict.decidedBy?.userName ?? "Another admin"} has already decided ${externalId}`
      );
    }

    return new BadRequestException(
      `The game is not a candidate for ${externalId}`
    );
  }

  private startApplying(source: IConflictSource) {
    this.hasNewDecisions.add(source);

    if (this.applying.has(source)) return;

    this.applyDecisions(source).catch((error) =>
      this.logger.error(error, `Applying ${source} conflict decisions failed`)
    );
  }

  private async applyDecisions(source: IConflictSource) {
    const handler = this.getHandler(source);

    this.applying.add(source);

    try {
      while (this.hasNewDecisions.delete(source)) {
        for (;;) {
          const decided = await this.conflictsModel
            .find({ source, status: "pending", decision: { $ne: null } })
            .limit(APPLY_BATCH_SIZE)
            .lean();

          if (!decided.length) break;

          await this.applyBatch(handler, decided);
        }
      }
    } finally {
      this.applying.delete(source);
    }
  }

  private async applyBatch(
    handler: IConflictSourceHandler,
    decided: ConflictDocument[]
  ) {
    const gameIdByExternalId = await handler.apply(
      decided.map((conflict) => ({
        externalId: conflict.externalId,
        externalName: conflict.externalName,
        externalData: conflict.externalData ?? null,
        decision: conflict.decision,
        winner: conflict.winner,
        winners: winnerIds(conflict),
        winnerEntryId: conflict.winnerEntryId ?? null,
      }))
    );

    await this.conflictsModel.bulkWrite(
      decided.map(({ _id, externalId, decision }) => {
        const isApplied = gameIdByExternalId.has(externalId);

        return {
          updateOne: {
            filter: { _id, status: "pending", decision },
            update: {
              $set: isApplied
                ? {
                    status: decision === "match" ? "resolved" : "absent",
                    winner: gameIdByExternalId.get(externalId) ?? null,
                    decision: null,
                  }
                : {
                    decision: null,
                    winner: null,
                    winners: [],
                    winnerEntryId: null,
                    decidedBy: null,
                  },
            },
          },
        };
      })
    );

    const externalIds = decided.map(({ externalId }) => externalId);

    this.events.conflictsApplied({ source: handler.source, externalIds });

    const returned = externalIds.filter((id) => !gameIdByExternalId.has(id));

    if (returned.length) {
      this.logger.warn(
        `${handler.source} decisions returned to review, nothing was written for ${returned.join(", ")}`
      );
    }

    this.logger.log(
      `Applied ${decided.length - returned.length}/${decided.length} ${handler.source} conflict decisions`
    );
  }
}
