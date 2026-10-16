import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { isDeepStrictEqual } from "node:util";
import { Model, Types } from "mongoose";
import {
  ConflictSourceSchema,
  type IConflictAiMatch,
  type IConflictAiVerdict,
  type IConflictItem,
  type IConflictSource,
  type IConflictState,
  type IConflictsResponse,
  type IConflictsSummary,
  type IGameConflict,
  type IGetConflictsParams,
} from "@mooncellar/schemas";
import { withDbLock } from "../../../shared/cron-mutex";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import { findGamesWithUserData } from "../../games/utils/game-user-data.utils";
import type { User } from "../../user/schemas/user.schema";
import {
  Conflict,
  type ConflictDocument,
  type IConflictCandidateEntry,
} from "../schemas/conflict.schema";
import { ConflictsGateway } from "../gateways/conflicts.gateway";
import type {
  IConflictDecision,
  IConflictGameChanges,
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

const AI_VERDICT = "$externalData.aiVerdict";

const UNTRACKED_GAME_FIELDS = new Set(["_id", "__v", "createdAt", "updatedAt"]);

const AI_VERDICT_RANK_FIELDS = {
  hasAiVerdict: { $cond: [{ $ifNull: [AI_VERDICT, false] }, 1, 0] },
  aiRank: {
    $cond: [
      { $ifNull: [`${AI_VERDICT}.undoneAt`, false] },
      0,
      {
        $add: [
          {
            $multiply: [
              {
                $add: [
                  {
                    $indexOfArray: [
                      ["low", "medium", "high"],
                      `${AI_VERDICT}.confidence`,
                    ],
                  },
                  1,
                ],
              },
              2,
            ],
          },
          {
            $cond: [
              {
                $gt: [{ $size: { $ifNull: [`${AI_VERDICT}.gameIds`, []] } }, 0],
              },
              1,
              0,
            ],
          },
        ],
      },
    ],
  },
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
  ...(candidate.isManual && { isManual: true }),
});

const readPath = (value: unknown, path: string): unknown =>
  path
    .split(".")
    .reduce<unknown>(
      (node, key) => (node as Record<string, unknown> | undefined)?.[key],
      value
    );

const pickKeys = (value: Record<string, unknown>, keys: string[]) =>
  Object.fromEntries(
    keys.filter((key) => key in value).map((key) => [key, value[key]])
  );

const diffGame = (
  gameId: string,
  before: Record<string, unknown> = {},
  after: Record<string, unknown> = {}
): IConflictGameChanges => {
  const keys = [
    ...new Set([...Object.keys(before), ...Object.keys(after)]),
  ].filter(
    (key) =>
      !UNTRACKED_GAME_FIELDS.has(key) &&
      !isDeepStrictEqual(before[key], after[key])
  );

  return {
    gameId,
    before: pickKeys(before, keys),
    after: pickKeys(after, keys),
  };
};

type TGameRecord = Record<string, unknown>;

@Injectable()
export class ConflictsService {
  private readonly logger = new Logger(ConflictsService.name);
  private readonly handlers = new Map<
    IConflictSource,
    IConflictSourceHandler
  >();
  private readonly applying = new Set<IConflictSource>();
  private readonly hasNewDecisions = new Set<IConflictSource>();
  private deleteGame?: (gameId: Types.ObjectId) => Promise<unknown>;

  constructor(
    @InjectModel(Conflict.name)
    private readonly conflictsModel: Model<Conflict>,
    @InjectModel(Game.name) private readonly gamesModel: Model<GameDocument>,
    private readonly events: ConflictsGateway
  ) {}

  register(handler: IConflictSourceHandler) {
    this.handlers.set(handler.source, handler);
  }

  useDeleteGame(deleteGame: (gameId: Types.ObjectId) => Promise<unknown>) {
    this.deleteGame = deleteGame;
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

  async refresh(source: IConflictSource, records: IConflictRecord[]) {
    if (!records.length) return;

    const manual = new Map(
      (
        await this.conflictsModel
          .find({
            source,
            externalId: { $in: records.map(({ externalId }) => externalId) },
            ...UNDECIDED_FILTER,
            "candidates.isManual": true,
          })
          .select("externalId candidates")
          .lean()
      ).map(({ externalId, candidates }) => [
        externalId,
        candidates.filter(({ isManual }) => isManual),
      ])
    );

    await this.conflictsModel.bulkWrite(
      records.map(
        ({
          externalId,
          externalName,
          externalData,
          reason,
          entries,
          candidates,
        }) => {
          const scored = candidates.map(toCandidateEntry);
          const scoredIds = new Set(scored.map(({ gameId }) => String(gameId)));
          const kept = (manual.get(externalId) ?? []).filter(
            ({ gameId }) => !scoredIds.has(String(gameId))
          );

          return {
            updateOne: {
              filter: { source, externalId, ...UNDECIDED_FILTER },
              update: {
                $set: {
                  externalName,
                  reason,
                  entries: entries ?? [],
                  ...(externalData && { externalData }),
                  ...(scored.length && { candidates: [...kept, ...scored] }),
                },
              },
            },
          };
        }
      ),
      { ordered: false }
    );
    await this.record(source, records);
  }

  async findUndecidedIds(source: IConflictSource): Promise<string[]> {
    return this.conflictsModel.distinct("externalId", {
      source,
      ...UNDECIDED_FILTER,
    });
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
          update: [
            {
              $set: {
                externalData: {
                  $mergeObjects: ["$externalData", { $literal: externalData }],
                },
              },
            },
          ],
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
      .select(
        "externalId externalData reason candidates.gameId candidates.isManual"
      )
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
    aiOnly,
    sortBy = "queue",
    sortOrder = "desc",
  }: IGetConflictsParams): Promise<IConflictsResponse> {
    const filter = {
      ...(source ? { source } : {}),
      ...(state ? STATE_FILTERS[state] : {}),
      ...(aiOnly ? { "externalData.aiVerdict": { $exists: true } } : {}),
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
        ...(sortBy === "ai"
          ? [
              { $addFields: AI_VERDICT_RANK_FIELDS },
              {
                $sort: {
                  hasAiVerdict: -1,
                  aiRank: sortOrder === "asc" ? 1 : -1,
                  isWaiting: -1,
                  _id: 1,
                },
              } as const,
            ]
          : [{ $sort: { isWaiting: -1, _id: 1 } } as const]),
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
        aiVerdict:
          (row.externalData?.aiVerdict as IConflictAiVerdict | undefined) ??
          null,
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
      decidedBy: conflict.decidedBy
        ? conflict.decidedBy.isAi
          ? `AI (${conflict.decidedBy.userName})`
          : conflict.decidedBy.userName
        : null,
      isUndoable:
        conflict.status === "resolved" ||
        (conflict.status === "absent" && this.skipCreatesGame(source)),
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
      aiVerdict:
        (conflict.externalData?.aiVerdict as IConflictAiVerdict | undefined) ??
        null,
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
    user: Pick<User, "_id" | "userName">,
    { isAi = false }: { isAi?: boolean } = {}
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
              ...(isAi && { isAi }),
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

  async undo(
    source: IConflictSource,
    externalId: string,
    user: Pick<User, "_id" | "userName">
  ): Promise<IConflictsSummary> {
    const handler = this.getHandler(source);
    const conflict = await this.conflictsModel
      .findOne({ source, externalId, status: { $in: ["resolved", "absent"] } })
      .lean();

    if (!conflict) {
      throw new ConflictException(
        `${externalId} is not a matched or skipped ${source} conflict`
      );
    }

    const isSkip = conflict.status === "absent";

    if (isSkip && !this.skipCreatesGame(source)) {
      throw new BadRequestException(
        `A ${source} Skip adds no game, so it is reopened rather than undone`
      );
    }

    const decision = {
      externalId,
      externalData: conflict.externalData ?? null,
      winners: winnerIds(conflict),
    };

    if (isSkip) await this.undoCreatedGame(source, decision);
    else if (handler.undo) await handler.undo(decision);
    else await this.undoChanges(handler, decision);

    const verdict = conflict.externalData?.aiVerdict as
      IConflictAiVerdict | undefined;

    await this.setExternalData(source, [
      {
        externalId,
        externalData: {
          ...(isSkip ? { created: null } : { changes: null }),
          ...(verdict && {
            aiVerdict: { ...verdict, undoneAt: new Date().toISOString() },
          }),
        },
      },
    ]);
    await this.conflictsModel.updateOne(
      { _id: conflict._id, status: conflict.status },
      {
        $set: {
          status: "pending",
          winner: null,
          winners: [],
          winnerEntryId: null,
          decision: null,
          decidedBy: null,
        },
      }
    );

    this.events.conflictDecided({
      source,
      externalId,
      state: "waiting",
      decidedBy: user.userName,
    });

    return this.getSummary(source);
  }

  skipCreatesGame(source: IConflictSource) {
    return !this.getHandler(source).rematch;
  }

  private async undoChanges(
    { source, linkField }: IConflictSourceHandler,
    {
      externalId,
      externalData,
      winners,
    }: Pick<IConflictDecision, "externalId" | "externalData" | "winners">
  ) {
    const linkKey = linkField.split(".")[0];
    const changes =
      (externalData?.changes as IConflictGameChanges[] | undefined) ??
      winners.map((id) => ({ gameId: String(id), before: {}, after: {} }));
    const now = new Date().toISOString();

    for (const { gameId, before, after } of changes) {
      const game = await this.gamesModel.findById(gameId).lean<TGameRecord>();

      if (!game || String(readPath(game, linkField)) !== externalId) continue;

      const keys = [
        linkKey,
        ...Object.keys({ ...before, ...after }).filter(
          (key) => key !== linkKey && isDeepStrictEqual(game[key], after[key])
        ),
      ];
      const unset = keys.filter((key) => !(key in before));

      await this.gamesModel.updateOne(
        { _id: gameId },
        {
          $set: { ...pickKeys(before, keys), updatedAt: now },
          ...(unset.length && {
            $unset: Object.fromEntries(unset.map((key) => [key, ""])),
          }),
        }
      );
      this.logger.log(
        `Undid the ${source} ${externalId} match on ${gameId}: ${keys.join(", ")}`
      );
    }
  }

  private async undoCreatedGame(
    source: IConflictSource,
    {
      externalId,
      externalData,
    }: Pick<IConflictDecision, "externalId" | "externalData">
  ) {
    const created = externalData?.created;

    if (created === undefined) {
      throw new ConflictException(
        "This Skip was made before created games were recorded, so the game it added is unknown. Delete that game by hand if it is wrong."
      );
    }

    if (typeof created !== "string") return;

    const gameId = new Types.ObjectId(created);
    const game = await this.gamesModel
      .findById(gameId)
      .select("_id name")
      .lean();

    if (!game) return;

    const used = await findGamesWithUserData(this.gamesModel.db, [gameId], 1);

    if (used.size) {
      throw new ConflictException(
        `"${game.name}" already has playthroughs, ratings, comments or list entries, so the Skip cannot be undone`
      );
    }

    await this.deleteGame!(gameId);
    this.logger.log(
      `Deleted "${game.name}" created by the Skip of ${source} ${externalId}`
    );
  }

  async getAiMatches(sources: IConflictSource[]): Promise<IConflictAiMatch[]> {
    const conflicts = await this.conflictsModel
      .find({
        source: { $in: sources },
        status: "resolved",
        "decidedBy.isAi": true,
      })
      .select(
        "source externalId externalName winner winners externalData.aiVerdict.confidence updatedAt"
      )
      .sort({ updatedAt: -1 })
      .lean<(Conflict & { _id: Types.ObjectId; updatedAt?: Date })[]>();
    const games = await this.gamesModel
      .find({ _id: { $in: conflicts.flatMap(winnerIds) } })
      .select("name slug")
      .lean();
    const gameById = new Map(games.map((game) => [String(game._id), game]));

    return conflicts.map((conflict) => ({
      source: conflict.source,
      externalId: conflict.externalId,
      externalName: conflict.externalName ?? conflict.externalId,
      games: winnerIds(conflict).flatMap((id) => {
        const game = gameById.get(String(id));

        return game
          ? [{ _id: String(game._id), name: game.name, slug: game.slug }]
          : [];
      }),
      confidence:
        (conflict.externalData?.aiVerdict as IConflictAiVerdict | undefined)
          ?.confidence ?? null,
      decidedAt: conflict.updatedAt?.toISOString() ?? "",
    }));
  }

  async findAiResolvedIds(source: IConflictSource): Promise<string[]> {
    return this.conflictsModel.distinct("externalId", {
      source,
      status: "resolved",
      "decidedBy.isAi": true,
    });
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
      const lock = await withDbLock(
        this.conflictsModel.db,
        `conflicts-apply-${source}`,
        async () => {
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
        }
      );

      if (!lock.locked) {
        this.logger.log(
          `${source} conflict decisions are being applied by another process`
        );
      }
    } finally {
      this.applying.delete(source);
    }
  }

  private async applyBatch(
    handler: IConflictSourceHandler,
    decided: ConflictDocument[]
  ) {
    const tracked = handler.undo
      ? []
      : decided
          .filter(({ decision }) => decision === "match")
          .flatMap(winnerIds);
    const before = await this.readGames(tracked);
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
    const [after, skipped] = await Promise.all([
      this.readGames(tracked),
      this.readGames(
        decided.flatMap(({ externalId, decision }) => {
          const gameId = gameIdByExternalId.get(externalId);

          return decision === "skip" && gameId ? [gameId] : [];
        })
      ),
    ]);

    await this.setExternalData(
      handler.source,
      decided.flatMap<{
        externalId: string;
        externalData: Record<string, unknown>;
      }>((conflict) => {
        const { externalId, decision } = conflict;

        if (!gameIdByExternalId.has(externalId)) return [];

        if (decision === "skip") {
          const gameId = gameIdByExternalId.get(externalId);
          const createdAt = gameId && skipped.get(String(gameId))?.createdAt;
          const { updatedAt: decidedAt } = conflict as { updatedAt?: Date };

          return [
            {
              externalId,
              externalData: {
                created:
                  createdAt &&
                  decidedAt &&
                  new Date(String(createdAt)) >= decidedAt
                    ? String(gameId)
                    : null,
              },
            },
          ];
        }

        return handler.undo
          ? []
          : [
              {
                externalId,
                externalData: {
                  changes: winnerIds(conflict).map((id) =>
                    diffGame(
                      String(id),
                      before.get(String(id)),
                      after.get(String(id))
                    )
                  ),
                },
              },
            ];
      })
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

  private async readGames(ids: Types.ObjectId[]) {
    if (!ids.length) return new Map<string, TGameRecord>();

    const games = await this.gamesModel
      .find({ _id: { $in: ids } })
      .lean<TGameRecord[]>();

    return new Map(games.map((game) => [String(game._id), game]));
  }
}
