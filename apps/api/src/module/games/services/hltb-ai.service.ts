import {
  ConflictException,
  Injectable,
  ServiceUnavailableException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import type { IConflictAiVerdict } from "@mooncellar/schemas";
import { HowLongToBeatService } from "howlongtobeat-ts";
import { Model } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import { withDbLock } from "../../../shared/cron-mutex";
import { callOpenAi, openAiModel, outputText } from "../../../shared/openai";
import { ConflictsService } from "../../conflicts/services/conflicts.service";
import type { User } from "../../user/schemas/user.schema";
import { Game, type GameDocument } from "../schemas/game.schema";
import { Platform, type PlatformDocument } from "../schemas/platform.schema";
import { HLTB_AI_CONCURRENCY } from "../constants/hltb";
import { type HltbSearchEntry, readHltbPage } from "../utils/hltb.utils";
import {
  buildHltbAiInput,
  HLTB_AI_INSTRUCTIONS,
  hltbAiSchema,
  isHltbAiMatch,
  toHltbAiVerdict,
} from "../utils/hltb-ai.utils";

type TReviewOptions = { limit: number; apply: boolean };
type TReviewer = Pick<User, "_id" | "userName">;
type TUndecided = Awaited<
  ReturnType<ConflictsService["findUndecided"]>
>[number];

@Injectable()
export class HltbAiService {
  private readonly hltbClient = new HowLongToBeatService();
  private isRunning = false;

  constructor(
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    @InjectModel(Platform.name)
    private readonly platformsModel: Model<PlatformDocument>,
    private readonly conflicts: ConflictsService,
    private readonly logger: PinoLogger
  ) {
    this.logger.setContext(HltbAiService.name);
  }

  start(options: TReviewOptions, user: TReviewer) {
    if (!process.env.OPENAI_API_KEY) {
      throw new ServiceUnavailableException("OPENAI_API_KEY is not set");
    }

    this.runInBackground(() => this.review(options, user));

    return {
      message: `HLTB AI review started: ${options.limit} conflicts${options.apply ? ", applying confident matches" : ", dry run"}`,
    };
  }

  startUndo(user: TReviewer) {
    this.runInBackground(() => this.undoAll(user));

    return { message: "Undoing every HLTB match the AI made" };
  }

  private runInBackground(job: () => Promise<unknown>) {
    if (this.isRunning) {
      throw new ConflictException("An HLTB AI job is already running");
    }

    this.isRunning = true;
    withDbLock(this.gamesModel.db, "hltb-ai", job)
      .then((lock) => {
        if (!lock.locked) {
          this.logger.warn("An HLTB AI job is running in another process");
        }
      })
      .catch((err) => this.logger.error(err, "HLTB AI job failed"))
      .finally(() => {
        this.isRunning = false;
      });
  }

  async undoAll(user: TReviewer) {
    const externalIds = await this.conflicts.findAiResolvedIds("hltb");
    let undone = 0;

    for (const externalId of externalIds) {
      await this.conflicts
        .undo("hltb", externalId, user)
        .then(() => (undone += 1))
        .catch((err) =>
          this.logger.warn(err, `HLTB AI could not undo ${externalId}`)
        );
    }

    this.logger.info(
      `HLTB AI undo finished: ${undone} of ${externalIds.length} matches undone`
    );

    return undone;
  }

  async review({ limit, apply }: TReviewOptions, user: TReviewer) {
    const undecided = await this.conflicts.findUndecided("hltb", { limit: 0 });
    const verdictOf = (conflict: TUndecided) =>
      conflict.externalData?.aiVerdict as IConflictAiVerdict | undefined;
    const queue = undecided
      .filter((conflict) => !verdictOf(conflict))
      .slice(0, limit);
    const platformNames = new Map(
      (await this.platformsModel.find({}).select("_id name").lean()).map(
        ({ _id, name }) => [String(_id), name]
      )
    );
    const totals = { judged: 0, matches: 0, failed: 0, decided: 0 };
    const decide = async (externalId: string, verdict?: IConflictAiVerdict) => {
      if (!apply || !isHltbAiMatch(verdict)) return;

      await this.conflicts
        .decide("hltb", externalId, { gameIds: verdict!.gameIds }, user, {
          isAi: true,
        })
        .then(() => (totals.decided += 1))
        .catch((err) =>
          this.logger.warn(err, `HLTB AI could not decide ${externalId}`)
        );
    };

    this.logger.info(
      `HLTB AI review: ${queue.length} of ${undecided.length} undecided conflicts to judge`
    );

    for (const conflict of undecided) {
      await decide(conflict.externalId, verdictOf(conflict));
    }

    for (let i = 0; i < queue.length; i += HLTB_AI_CONCURRENCY) {
      const batch = queue.slice(i, i + HLTB_AI_CONCURRENCY);
      const verdicts = await Promise.all(
        batch.map((conflict) =>
          this.judge(conflict, platformNames).catch((err) => {
            this.logger.warn(err, `HLTB AI failed on ${conflict.externalId}`);
            totals.failed += 1;

            return null;
          })
        )
      );

      if (verdicts.every((verdict) => !verdict)) {
        throw new Error(
          `HLTB AI review stopped: a whole batch failed (${JSON.stringify(totals)})`
        );
      }

      await this.conflicts.setExternalData(
        "hltb",
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

        totals.judged += 1;
        if (isHltbAiMatch(verdict)) totals.matches += 1;
        await decide(batch[index].externalId, verdict);
      }

      if ((i / HLTB_AI_CONCURRENCY) % 20 === 19) {
        this.logger.info(`HLTB AI review progress: ${JSON.stringify(totals)}`);
      }
    }

    this.logger.info(`HLTB AI review finished: ${JSON.stringify(totals)}`);

    return totals;
  }

  private async judge(
    conflict: TUndecided,
    platformNames: Map<string, string>
  ): Promise<IConflictAiVerdict> {
    const model = openAiModel();
    const entry = {
      ...(conflict.externalData as HltbSearchEntry),
      id: Number(conflict.externalId),
    };
    const [games, page] = await Promise.all([
      this.gamesModel
        .find({
          _id: { $in: conflict.candidates.map(({ gameId }) => gameId) },
          "hltb.hltbId": { $exists: false },
        })
        .select(
          "name alternative_names type first_release platformIds companies summary"
        )
        .lean(),
      this.hltbClient
        .getById(entry.id)
        .then((response) =>
          response.success && response.data
            ? readHltbPage(
                response.data.raw as unknown as Record<string, unknown>
              )
            : null
        )
        .catch(() => null),
    ]);

    if (!games.length) {
      return {
        gameIds: [],
        confidence: "low",
        reason: "Every candidate is already linked to an HLTB entry.",
        model,
        judgedAt: new Date().toISOString(),
      };
    }

    const gameIds = games.map(({ _id }) => String(_id));
    const response = await callOpenAi(process.env.OPENAI_API_KEY!, {
      model,
      instructions: HLTB_AI_INSTRUCTIONS,
      input: buildHltbAiInput({ entry, page, games, platformNames }),
      text: {
        format: {
          type: "json_schema",
          name: "hltb_match",
          strict: true,
          schema: hltbAiSchema(gameIds),
        },
      },
    });

    return toHltbAiVerdict(outputText(response.output), gameIds, model);
  }
}
