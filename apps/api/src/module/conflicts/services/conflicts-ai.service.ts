import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  ConflictSourceSchema,
  type IConflictAiVerdict,
  type IConflictsAiStatus,
  type IConflictSource,
} from "@mooncellar/schemas";
import { Model } from "mongoose";
import { withDbLock } from "../../../shared/cron-mutex";
import { callOpenAi, openAiModel, outputText } from "../../../shared/openai";
import { Game, type GameDocument } from "../../games/schemas/game.schema";
import {
  Platform,
  type PlatformDocument,
} from "../../games/schemas/platform.schema";
import type { User } from "../../user/schemas/user.schema";
import {
  buildConflictAiInput,
  CONFLICTS_AI_CONCURRENCY,
  conflictAiInstructions,
  conflictAiSchema,
  isConflictAiMatch,
  isConflictAiNoMatch,
  noMatchVerdict,
  toConflictAiVerdict,
} from "../utils/conflicts-ai.utils";
import { ConflictsService } from "./conflicts.service";

type TReviewOptions = { limit: number; apply: boolean };
type TReviewer = Pick<User, "_id" | "userName">;

export type TUndecidedConflict = Awaited<
  ReturnType<ConflictsService["findUndecided"]>
>[number];

export type TConflictJudge = (
  conflict: TUndecidedConflict,
  platformNames: Map<string, string>
) => Promise<IConflictAiVerdict>;

type TPlan = {
  source: IConflictSource;
  stored: TUndecidedConflict[];
  queue: TUndecidedConflict[];
};

const IDLE_STATUS: IConflictsAiStatus = {
  isRunning: false,
  action: null,
  source: null,
  total: 0,
  done: 0,
  judged: 0,
  matches: 0,
  decided: 0,
  undone: 0,
  failed: 0,
  startedAt: null,
  finishedAt: null,
  error: null,
};

const errorMessage = (err: unknown) => (err as Error)?.message ?? String(err);

const verdictOf = (conflict: TUndecidedConflict) =>
  conflict.externalData?.aiVerdict as IConflictAiVerdict | undefined;

@Injectable()
export class ConflictsAiService {
  private readonly logger = new Logger(ConflictsAiService.name);
  private readonly judges = new Map<IConflictSource, TConflictJudge>();
  private readonly creatable = new Map<
    IConflictSource,
    (conflict: TUndecidedConflict) => boolean
  >();
  private status: IConflictsAiStatus = { ...IDLE_STATUS };

  constructor(
    @InjectModel(Game.name) private readonly gamesModel: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<PlatformDocument>,
    private readonly conflicts: ConflictsService
  ) {}

  register(
    source: IConflictSource,
    {
      judge,
      canCreate,
    }: {
      judge?: TConflictJudge;
      canCreate?: (conflict: TUndecidedConflict) => boolean;
    }
  ) {
    if (judge) this.judges.set(source, judge);
    if (canCreate) this.creatable.set(source, canCreate);
  }

  getStatus(): IConflictsAiStatus {
    return this.status;
  }

  start(
    source: IConflictSource | undefined,
    options: TReviewOptions,
    user: TReviewer
  ) {
    if (!process.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not set");
    }

    const sources = source ? [source] : ConflictSourceSchema.options;
    const scope = source ? `${source} conflicts` : "conflicts of each source";

    this.runInBackground(
      { action: options.limit ? "review" : "apply", source: source ?? null },
      async () => {
        const plans: TPlan[] = [];

        for (const next of sources) plans.push(await this.plan(next, options));
        this.status.total = plans.reduce(
          (sum, { stored, queue }) => sum + stored.length + queue.length,
          0
        );

        for (const plan of plans) await this.execute(plan, options.apply, user);
      }
    );

    return {
      message: options.limit
        ? `AI review of ${options.limit} ${scope} started${options.apply ? ", applying confident matches" : ", dry run"}`
        : `Applying the confident AI verdicts of ${source ?? "every source"}`,
    };
  }

  getMatches(source: IConflictSource | undefined) {
    return this.conflicts.getAiMatches(this.undoableSources(source));
  }

  private undoableSources(source: IConflictSource | undefined) {
    if (source && !this.conflicts.canUndo(source)) {
      throw new BadRequestException(`${source} decisions cannot be undone`);
    }

    return source
      ? [source]
      : ConflictSourceSchema.options.filter((next) =>
          this.conflicts.canUndo(next)
        );
  }

  startUndo(
    source: IConflictSource | undefined,
    user: TReviewer,
    items?: { source: IConflictSource; externalId: string }[]
  ) {
    const sources = this.undoableSources(source);

    this.runInBackground(
      { action: "undo", source: source ?? null },
      async () => {
        const plans: { source: IConflictSource; externalIds: string[] }[] = [];

        for (const next of sources) {
          const resolved = await this.conflicts.findAiResolvedIds(next);
          const picked = items
            ? new Set(
                items
                  .filter((item) => item.source === next)
                  .map(({ externalId }) => externalId)
              )
            : null;

          plans.push({
            source: next,
            externalIds: picked
              ? resolved.filter((externalId) => picked.has(externalId))
              : resolved,
          });
        }
        this.status.total = plans.reduce(
          (sum, { externalIds }) => sum + externalIds.length,
          0
        );

        for (const plan of plans) {
          await this.undoIds(plan.source, plan.externalIds, user);
        }
      }
    );

    return {
      message: items
        ? `Undoing ${items.length} AI ${items.length === 1 ? "match" : "matches"}`
        : `Undoing every ${sources.join(", ")} match the AI made`,
    };
  }

  startCreate(source: IConflictSource | undefined, user: TReviewer) {
    if (source && !this.creatable.has(source)) {
      throw new BadRequestException(
        `The AI does not add ${source} entries as new games`
      );
    }

    const sources = source
      ? [source]
      : ConflictSourceSchema.options.filter((next) => this.creatable.has(next));

    this.runInBackground(
      { action: "create", source: source ?? null },
      async () => {
        const plans: {
          source: IConflictSource;
          conflicts: TUndecidedConflict[];
        }[] = [];

        for (const next of sources) {
          const canCreate = this.creatable.get(next)!;
          const undecided = await this.conflicts.findUndecided(next, {
            limit: 0,
          });

          plans.push({
            source: next,
            conflicts: undecided.filter(
              (conflict) =>
                isConflictAiNoMatch(verdictOf(conflict)) && canCreate(conflict)
            ),
          });
        }
        this.status.total = plans.reduce(
          (sum, { conflicts }) => sum + conflicts.length,
          0
        );

        for (const plan of plans) await this.createGames(plan, user);
      }
    );

    return {
      message: `Adding games for the confident no-match verdicts of ${source ?? sources.join(", ")}`,
    };
  }

  private async createGames(
    {
      source,
      conflicts,
    }: { source: IConflictSource; conflicts: TUndecidedConflict[] },
    user: TReviewer
  ) {
    const status = this.status;

    for (const { externalId } of conflicts) {
      await this.conflicts
        .decide(source, externalId, { gameId: null }, user, { isAi: true })
        .then(() => (status.decided += 1))
        .catch((err) =>
          this.logger.warn(
            `${source} AI could not skip ${externalId}: ${errorMessage(err)}`
          )
        );
      status.done += 1;
    }

    this.logger.log(
      `${source} AI queued ${status.decided} of ${conflicts.length} entries as new games`
    );
  }

  private runInBackground(
    job: Pick<IConflictsAiStatus, "action" | "source">,
    run: () => Promise<unknown>
  ) {
    if (this.status.isRunning) {
      throw new ConflictException("An AI review is already running");
    }

    const status: IConflictsAiStatus = {
      ...IDLE_STATUS,
      ...job,
      isRunning: true,
      startedAt: new Date().toISOString(),
    };

    this.status = status;
    withDbLock(this.gamesModel.db, "conflicts-ai", run)
      .then((lock) => {
        if (!lock.locked) {
          status.error = "An AI review is running in another process";
        }
      })
      .catch((err) => {
        this.logger.error(`AI job failed: ${errorMessage(err)}`);
        status.error = errorMessage(err);
      })
      .finally(() => {
        status.isRunning = false;
        status.finishedAt = new Date().toISOString();
      });
  }

  async undoAll(source: IConflictSource, user: TReviewer) {
    return this.undoIds(
      source,
      await this.conflicts.findAiResolvedIds(source),
      user
    );
  }

  private async undoIds(
    source: IConflictSource,
    externalIds: string[],
    user: TReviewer
  ) {
    const status = this.status;
    let undone = 0;

    for (const externalId of externalIds) {
      await this.conflicts
        .undo(source, externalId, user)
        .then(() => {
          undone += 1;
          status.undone += 1;
        })
        .catch((err) =>
          this.logger.warn(
            `${source} AI could not undo ${externalId}: ${errorMessage(err)}`
          )
        );
      status.done += 1;
    }

    this.logger.log(
      `${source} AI undo finished: ${undone} of ${externalIds.length} matches undone`
    );

    return undone;
  }

  async review(
    source: IConflictSource,
    options: TReviewOptions,
    user: TReviewer
  ) {
    const plan = await this.plan(source, options);

    this.status.total += plan.stored.length + plan.queue.length;
    await this.execute(plan, options.apply, user);

    const { judged, matches, failed, decided } = this.status;

    return { judged, matches, failed, decided };
  }

  private async plan(
    source: IConflictSource,
    { limit, apply }: TReviewOptions
  ): Promise<TPlan> {
    const undecided = await this.conflicts.findUndecided(source, { limit: 0 });

    return {
      source,
      stored: apply
        ? undecided.filter((conflict) => isConflictAiMatch(verdictOf(conflict)))
        : [],
      queue: undecided
        .filter((conflict) => !verdictOf(conflict))
        .slice(0, limit),
    };
  }

  private async execute(
    { source, stored, queue }: TPlan,
    apply: boolean,
    user: TReviewer
  ) {
    const status = this.status;
    const platformNames = new Map(
      (await this.platformsModel.find({}).select("_id name").lean()).map(
        ({ _id, name }) => [String(_id), name]
      )
    );
    const judge = this.judges.get(source) ?? this.judgeItem(source);
    const decide = async (externalId: string, verdict?: IConflictAiVerdict) => {
      if (!apply || !isConflictAiMatch(verdict)) return;

      await this.conflicts
        .decide(source, externalId, { gameIds: verdict!.gameIds }, user, {
          isAi: true,
        })
        .then(() => (status.decided += 1))
        .catch((err) =>
          this.logger.warn(
            `${source} AI could not decide ${externalId}: ${errorMessage(err)}`
          )
        );
    };

    this.logger.log(
      `${source} AI review: ${stored.length} stored verdicts to apply, ${queue.length} conflicts to judge`
    );

    for (const conflict of stored) {
      await decide(conflict.externalId, verdictOf(conflict));
      status.done += 1;
    }

    for (let i = 0; i < queue.length; i += CONFLICTS_AI_CONCURRENCY) {
      const batch = queue.slice(i, i + CONFLICTS_AI_CONCURRENCY);
      const verdicts = await Promise.all(
        batch.map((conflict) =>
          judge(conflict, platformNames).catch((err) => {
            this.logger.warn(
              `${source} AI failed on ${conflict.externalId}: ${errorMessage(err)}`
            );
            status.failed += 1;

            return null;
          })
        )
      );

      if (verdicts.every((verdict) => !verdict)) {
        throw new Error(
          `${source} AI review stopped: a whole batch failed (${status.judged} judged, ${status.failed} failed)`
        );
      }

      await this.conflicts.setExternalData(
        source,
        batch.flatMap((conflict, index) => {
          const verdict = verdicts[index];

          return verdict
            ? [
                {
                  externalId: conflict.externalId,
                  externalData: { aiVerdict: verdict },
                },
              ]
            : [];
        })
      );

      for (const [index, verdict] of verdicts.entries()) {
        if (!verdict) continue;

        status.judged += 1;
        if (isConflictAiMatch(verdict)) status.matches += 1;
        await decide(batch[index].externalId, verdict);
      }

      status.done += batch.length;
    }

    this.logger.log(
      `${source} AI review finished: ${status.judged} judged, ${status.matches} matches, ${status.decided} decided, ${status.failed} failed`
    );
  }

  private judgeItem(source: IConflictSource): TConflictJudge {
    return async (conflict, platformNames) => {
      const model = openAiModel();
      const item = await this.conflicts.getItem(source, conflict.externalId);

      if (!item?.subject) {
        return noMatchVerdict("The source no longer has this entry.", model);
      }

      const gameIds = item.candidates
        .filter(({ game }) => game)
        .map(({ gameId }) => gameId);

      if (!gameIds.length) {
        return noMatchVerdict("No candidate game exists any more.", model);
      }

      const response = await callOpenAi(process.env.OPENAI_API_KEY!, {
        model,
        instructions: conflictAiInstructions(source, item.isMultiMatch),
        input: buildConflictAiInput(item, platformNames),
        text: {
          format: {
            type: "json_schema",
            name: "conflict_match",
            strict: true,
            schema: conflictAiSchema(gameIds),
          },
        },
      });

      return toConflictAiVerdict(outputText(response.output), gameIds, model);
    };
  }
}
