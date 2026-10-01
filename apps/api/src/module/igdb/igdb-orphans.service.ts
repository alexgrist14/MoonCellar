import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection, InjectModel } from "@nestjs/mongoose";
import { Cron } from "@nestjs/schedule";
import { Model, Types } from "mongoose";
import type { Connection } from "mongoose";
import { PinoLogger } from "nestjs-pino";
import {
  IGDB_ORPHANS_DEFAULT_LIMIT,
  type IIgdbOrphanEntry,
  type IIgdbOrphanReason,
  type IIgdbOrphansRun,
  type IStartIgdbOrphansRequest,
} from "@mooncellar/schemas";
import { Game, type GameDocument } from "../games/schemas/game.schema";
import { GamesService } from "../games/services/games.service";
import { BusinessMetricsService } from "../metrics/business-metrics.service";
import { runInCronLogContext } from "../../shared/cron-logging";
import { runCronExclusive, withDbLock } from "../../shared/cron-mutex";
import {
  buildIgdbQueryParams,
  getLink,
  igdbAgent,
  igdbAuth,
  wait,
} from "./utils/igdb";
import {
  IGDB_ORPHANS_BATCH_SIZE,
  IGDB_ORPHANS_CRON,
  IGDB_ORPHANS_CRON_OPTIONS,
  IGDB_ORPHANS_DELAY_MS,
  IGDB_ORPHANS_LIST_LIMIT,
  IGDB_ORPHANS_MAX_ATTEMPTS,
  IGDB_ORPHANS_MAX_MISSING,
  IGDB_ORPHANS_MAX_RATIO,
  IGDB_ORPHANS_PROGRESS_EVERY,
} from "./constants/sync";

const JOB = IGDB_ORPHANS_CRON_OPTIONS.name;

type TCandidate = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  igdb: { gameId: number };
  vndb?: { vnId?: string };
  isCustom?: boolean;
};

const USER_DATA_SOURCES = [
  { collection: "playthroughs", field: "gameId" },
  { collection: "ratings", field: "gameId" },
  { collection: "userlogs", field: "gameId" },
  { collection: "gamecomments", field: "gameId" },
  { collection: "customlists", field: "games.gameId" },
  { collection: "users", field: "favorites" },
  { collection: "users", field: "royalGames" },
];

@Injectable()
export class IgdbOrphansService {
  private readonly logger = new Logger(IgdbOrphansService.name);
  private run?: IIgdbOrphansRun;

  constructor(
    @InjectModel(Game.name) private readonly games: Model<GameDocument>,
    @InjectConnection() private readonly connection: Connection,
    private readonly gamesService: GamesService,
    private readonly pino: PinoLogger,
    private readonly metrics: BusinessMetricsService
  ) {}

  getState() {
    if (!this.run) throw new NotFoundException("No IGDB orphan run recorded");

    return this.run;
  }

  start(options: IStartIgdbOrphansRequest) {
    const run = this.begin("manual", options);

    void this.execute(run);

    return run;
  }

  @Cron(IGDB_ORPHANS_CRON, IGDB_ORPHANS_CRON_OPTIONS)
  async cron() {
    return runCronExclusive(() =>
      runInCronLogContext(this.pino, JOB, () =>
        this.metrics.trackSync(JOB, () => this.runCron())
      )
    );
  }

  async runCron() {
    if (this.run?.running) {
      this.logger.warn("IGDB orphans cron skipped: a run is already running");
      return;
    }

    return this.execute(this.begin("cron", { apply: true }));
  }

  private begin(
    trigger: IIgdbOrphansRun["trigger"],
    options: IStartIgdbOrphansRequest
  ) {
    if (this.run?.running) {
      throw new ConflictException("An IGDB orphan run is already running");
    }

    this.run = {
      running: true,
      trigger,
      apply: options.apply === true,
      limit: options.limit ?? IGDB_ORPHANS_DEFAULT_LIMIT,
      startedAt: new Date().toISOString(),
      scanned: 0,
      missing: 0,
      deleted: 0,
      unlinked: 0,
      kept: 0,
      deferred: 0,
      failed: 0,
      deletedGames: [],
      unlinkedGames: [],
      keptGames: [],
    };

    return this.run;
  }

  private async execute(run: IIgdbOrphansRun) {
    const startedAt = Date.now();

    this.logger.log(
      `IGDB orphans ${run.trigger} run started in ${run.apply ? "apply" : "dry-run"} mode, delete limit ${run.limit}`
    );

    try {
      const lock = await withDbLock(this.connection, JOB, () => this.scan(run));

      if (!lock.locked) {
        run.error = "Skipped: another process holds the IGDB orphans lock";
        this.logger.warn(
          `IGDB orphans ${run.trigger} run skipped: ${run.error}`
        );
      }
    } catch (err) {
      run.error = (err as Error).message;
      this.logger.error(err, "IGDB orphans run failed");
    } finally {
      run.running = false;
      run.finishedAt = new Date().toISOString();
    }

    this.logger.log(
      `IGDB orphans ${run.trigger} run finished in ${Math.round((Date.now() - startedAt) / 1000)}s: scanned ${run.scanned}, missing ${run.missing}, deleted ${run.deleted}, unlinked ${run.unlinked}, kept ${run.kept}, deferred ${run.deferred}, failed ${run.failed}${run.refusedReason ? `, refused: ${run.refusedReason}` : ""}`
    );

    return run;
  }

  private async scan(run: IIgdbOrphansRun) {
    const { data } = await igdbAuth();
    const token = data.access_token;
    const candidates: TCandidate[] = [];
    let lastId: Types.ObjectId | undefined;
    let batches = 0;

    while (!run.refusedReason) {
      const games = await this.games
        .find({
          "igdb.gameId": { $exists: true, $ne: null },
          isStopParsing: { $ne: true },
          ...(lastId && { _id: { $gt: lastId } }),
        })
        .sort({ _id: 1 })
        .limit(IGDB_ORPHANS_BATCH_SIZE)
        .select("_id name slug igdb.gameId vndb.vnId isCustom")
        .lean<TCandidate[]>();

      if (!games.length) break;

      lastId = games[games.length - 1]._id;
      run.scanned += games.length;

      const ids = [
        ...new Set(
          games.map((game) => game.igdb.gameId).filter(Number.isInteger)
        ),
      ];
      const present = ids.length
        ? await this.fetchPresentIds(token, ids)
        : new Set<number>();

      if (!present) {
        run.refusedReason = `IGDB request failed for ids ${ids[0]}..${ids[ids.length - 1]}`;
        this.logger.error(
          `IGDB orphans: ${run.refusedReason}, refusing to write: ${ids.join(",")}`
        );
        break;
      }

      const missing = games.filter(
        (game) =>
          Number.isInteger(game.igdb.gameId) && !present.has(game.igdb.gameId)
      );

      candidates.push(...missing);
      run.missing += missing.length;

      if (run.missing > IGDB_ORPHANS_MAX_MISSING) {
        run.refusedReason = `More than ${IGDB_ORPHANS_MAX_MISSING} games are missing in IGDB`;
      }

      batches += 1;

      if (batches % IGDB_ORPHANS_PROGRESS_EVERY === 0) {
        this.logger.log(
          `IGDB orphans progress: scanned ${run.scanned}, missing ${run.missing}`
        );
      }

      await wait(IGDB_ORPHANS_DELAY_MS);
    }

    if (
      !run.refusedReason &&
      run.missing > run.scanned * IGDB_ORPHANS_MAX_RATIO
    ) {
      run.refusedReason = `${run.missing} of ${run.scanned} games are missing in IGDB, above the ${IGDB_ORPHANS_MAX_RATIO * 100}% limit`;
    }

    if (run.refusedReason) {
      this.logger.warn(`IGDB orphans refused to write: ${run.refusedReason}`);
    }

    await this.classify(run, candidates, run.apply && !run.refusedReason);
  }

  private async fetchPresentIds(token: string, ids: number[]) {
    for (let attempt = 1; attempt <= IGDB_ORPHANS_MAX_ATTEMPTS; attempt++) {
      try {
        const { status, data } = await igdbAgent<{ id: number }[]>(
          getLink("games"),
          token,
          buildIgdbQueryParams("id", {
            where: `id = (${ids.join(",")})`,
            limit: IGDB_ORPHANS_BATCH_SIZE,
          })
        );

        if (
          status === 200 &&
          Array.isArray(data) &&
          data.every((item) => typeof item?.id === "number")
        ) {
          return new Set(data.map((item) => item.id));
        }

        this.logger.warn(
          `IGDB orphans: unexpected IGDB answer (status ${status}) for ids ${ids[0]}..${ids[ids.length - 1]}, attempt ${attempt}`
        );
      } catch (err) {
        this.logger.warn(
          `IGDB orphans: IGDB request failed for ids ${ids[0]}..${ids[ids.length - 1]}, attempt ${attempt}: ${(err as Error).message}`
        );
      }

      await wait(IGDB_ORPHANS_DELAY_MS * attempt);
    }

    return undefined;
  }

  private async classify(
    run: IIgdbOrphansRun,
    candidates: TCandidate[],
    writes: boolean
  ) {
    const plain: TCandidate[] = [];

    for (const game of candidates) {
      const reason: IIgdbOrphanReason | undefined = game.vndb?.vnId
        ? "vndb-owned"
        : game.isCustom
          ? "custom"
          : undefined;

      if (!reason) {
        plain.push(game);
        continue;
      }

      if (writes) {
        try {
          await this.games.updateOne(
            { _id: game._id, "igdb.gameId": game.igdb.gameId },
            { $unset: { igdb: "" } }
          );
          this.logger.debug(`IGDB orphans: unlinked ${game.slug} (${reason})`);
        } catch (err) {
          run.failed += 1;
          this.logger.error(err, `IGDB orphans: failed to unlink ${game.slug}`);
          continue;
        }
      }

      run.unlinked += 1;
      this.record(run.unlinkedGames, game, reason);
    }

    const withUserData = await this.findGamesWithUserData(
      plain.map((game) => game._id)
    );

    for (const game of plain) {
      if (withUserData.has(String(game._id))) {
        run.kept += 1;
        this.record(run.keptGames, game, "user-data");
        continue;
      }

      if (run.deleted >= run.limit) {
        run.deferred += 1;
        continue;
      }

      if (writes) {
        try {
          await this.gamesService.deleteGame(game._id);
          this.logger.debug(
            `IGDB orphans: deleted ${game.slug} (igdb ${game.igdb.gameId})`
          );
        } catch (err) {
          run.failed += 1;
          this.logger.error(err, `IGDB orphans: failed to delete ${game.slug}`);
          continue;
        }
      }

      run.deleted += 1;
      this.record(run.deletedGames, game, "orphan");
    }
  }

  private async findGamesWithUserData(ids: Types.ObjectId[]) {
    const found = new Set<string>();

    for (let i = 0; i < ids.length; i += IGDB_ORPHANS_BATCH_SIZE) {
      const chunk = ids.slice(i, i + IGDB_ORPHANS_BATCH_SIZE);
      const values = [...chunk, ...chunk.map(String)];
      const results = await Promise.all(
        USER_DATA_SOURCES.map(({ collection, field }) =>
          this.connection
            .collection(collection)
            .distinct(field, { [field]: { $in: values } })
        )
      );

      results.flat().forEach((id) => found.add(String(id)));
    }

    return found;
  }

  private record(
    list: IIgdbOrphanEntry[],
    game: TCandidate,
    reason: IIgdbOrphanReason
  ) {
    if (list.length >= IGDB_ORPHANS_LIST_LIMIT) return;

    list.push({
      id: String(game._id),
      name: game.name,
      slug: game.slug,
      igdbId: game.igdb.gameId,
      reason,
    });
  }
}
