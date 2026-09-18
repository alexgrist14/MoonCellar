import { HttpService } from "@nestjs/axios";
import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import mongoose, { Model, Types, type FilterQuery } from "mongoose";
import { Game, type GameDocument } from "../schemas/game.schema";
import { FileService } from "../../user/services/file-upload.service";
import {
  getS3CdnUrl,
  parseS3ImageUrl,
  type S3Folder,
} from "../../../shared/s3";
import {
  DEFAULT_PERCEPTUAL_THRESHOLD,
  MAX_PERCEPTUAL_THRESHOLD,
  getHammingDistance,
  getImageFingerprint,
  type IImageFingerprint,
} from "../../../shared/image-hash";
import {
  type IGameImageDedupeBatchOptions,
  type IGameImageDedupeOptions,
  type IGameImageDedupeReport,
  type IGameImageDedupeRun,
  type IGameImageDuplicateGroup,
  type IGameImageEntry,
  type IGameImageUnreadable,
  type TGameImageField,
} from "../interface/image-dedupe.interface";

const DEDUPE_FIELDS: TGameImageField[] = ["screenshots", "artworks"];
const DOWNLOAD_CONCURRENCY = 6;
const DOWNLOAD_TIMEOUT_MS = 30000;
const BATCH_PAGE_SIZE = 100;
const BATCH_LOG_EVERY = 50;
const BATCH_MAX_FAILURES_KEPT = 100;

type TDedupeGame = Pick<Game, "slug" | "cover" | "screenshots" | "artworks"> & {
  _id: Types.ObjectId;
};

const escapeRegExp = (value: string) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

@Injectable()
export class ImageDedupeService {
  private readonly logger = new Logger(ImageDedupeService.name);
  private run?: IGameImageDedupeRun;

  constructor(
    private readonly httpService: HttpService,
    @InjectModel(Game.name)
    private readonly gamesModel: Model<GameDocument>,
    private readonly fileService: FileService
  ) {}

  async dedupeGame(slug: string, options?: IGameImageDedupeOptions) {
    const game = await this.gamesModel
      .findOne({ slug })
      .select("_id slug cover screenshots artworks")
      .lean<TDedupeGame>();

    if (!game) throw new NotFoundException(`Game not found: ${slug}`);

    return this.dedupeGameDocument(game, options);
  }

  getBatchState() {
    if (!this.run) throw new NotFoundException("No image dedupe run recorded");

    return this.run;
  }

  startBatch(options: IGameImageDedupeBatchOptions) {
    if (this.run?.running) {
      throw new ConflictException("Image dedupe is already running");
    }

    this.run = {
      running: true,
      stopRequested: false,
      startedAt: new Date().toISOString(),
      options,
      scanned: 0,
      withDuplicates: 0,
      duplicates: 0,
      unreadable: 0,
      deletedObjects: 0,
      failed: [],
    };

    void this.runBatch(options).catch((error) => {
      this.logger.error(error, "Image dedupe batch failed");
    });

    return this.run;
  }

  stopBatch() {
    if (!this.run?.running) {
      throw new ConflictException("No image dedupe run in progress");
    }

    this.run.stopRequested = true;

    return this.run;
  }

  private resolveThreshold(threshold?: number) {
    if (threshold === undefined) return DEFAULT_PERCEPTUAL_THRESHOLD;

    if (
      !Number.isInteger(threshold) ||
      threshold < 0 ||
      threshold > MAX_PERCEPTUAL_THRESHOLD
    ) {
      throw new BadRequestException(
        `threshold must be an integer between 0 and ${MAX_PERCEPTUAL_THRESHOLD}`
      );
    }

    return threshold;
  }

  private async dedupeGameDocument(
    game: TDedupeGame,
    options?: IGameImageDedupeOptions
  ): Promise<IGameImageDedupeReport> {
    const threshold = this.resolveThreshold(options?.threshold);
    const fields = options?.fields?.length ? options.fields : DEDUPE_FIELDS;
    const apply = options?.apply === true;
    const deleteObjects = apply && options?.deleteObjects === true;

    const positions: { field: TGameImageField; index: number; url: string }[] =
      [];

    for (const field of fields) {
      (game[field] ?? []).forEach((url, index) => {
        if (url) positions.push({ field, index, url });
      });
    }

    const { fingerprints, failures } = await this.fingerprintUrls(
      positions.map(({ url }) => url)
    );

    const unreadable: IGameImageUnreadable[] = positions
      .filter(({ url }) => failures.has(url))
      .map(({ field, index, url }) => ({
        field,
        index,
        url,
        reason: failures.get(url),
      }));

    const entries: IGameImageEntry[] = positions
      .filter(({ url }) => fingerprints.has(url))
      .map(({ field, index, url }) => ({
        field,
        index,
        url,
        width: fingerprints.get(url).width,
        height: fingerprints.get(url).height,
      }));

    const buckets: IGameImageEntry[][] = [];

    for (const entry of entries) {
      const fingerprint = fingerprints.get(entry.url);
      const bucket = buckets.find((members) => {
        const head = fingerprints.get(members[0].url);

        return (
          head.md5 === fingerprint.md5 ||
          getHammingDistance(head.dHash, fingerprint.dHash) <= threshold
        );
      });

      if (bucket) {
        bucket.push(entry);
      } else {
        buckets.push([entry]);
      }
    }

    const groups: IGameImageDuplicateGroup[] = buckets
      .filter((members) => members.length > 1)
      .map((members) => {
        const [keep, ...rest] = [...members].sort((left, right) =>
          this.compareByPreference(left, right, fields)
        );
        const keepFingerprint = fingerprints.get(keep.url);

        return {
          keep,
          duplicates: rest.map((entry) => {
            const fingerprint = fingerprints.get(entry.url);

            return {
              ...entry,
              matchedBy:
                fingerprint.md5 === keepFingerprint.md5
                  ? ("md5" as const)
                  : ("perceptual" as const),
              distance: getHammingDistance(
                fingerprint.dHash,
                keepFingerprint.dHash
              ),
            };
          }),
        };
      });

    const droppedPositions = new Set(
      groups.flatMap(({ duplicates }) =>
        duplicates.map(({ field, index }) => `${field}:${index}`)
      )
    );

    const update: Partial<Record<TGameImageField, string[]>> = {};

    for (const field of fields) {
      const current = game[field] ?? [];
      const next = current.filter(
        (_, index) => !droppedPositions.has(`${field}:${index}`)
      );

      if (next.length !== current.length) update[field] = next;
    }

    if (apply && Object.keys(update).length) {
      await this.gamesModel.updateOne({ _id: game._id }, { $set: update });
    }

    const { deleted, skipped } = deleteObjects
      ? await this.deleteDroppedObjects(game, update, groups)
      : { deleted: [], skipped: [] };

    return {
      gameId: game._id.toString(),
      slug: game.slug,
      applied: apply,
      deletedObjectsEnabled: deleteObjects,
      threshold,
      checked: entries.length,
      duplicates: droppedPositions.size,
      groups,
      unreadable,
      skippedObjects: skipped,
      deletedObjects: deleted,
    };
  }

  private compareByPreference(
    left: IGameImageEntry,
    right: IGameImageEntry,
    fields: TGameImageField[]
  ) {
    const cdnPrefix = `${getS3CdnUrl()}/`;
    const rank = (entry: IGameImageEntry) => [
      entry.url.startsWith(cdnPrefix) ? 0 : 1,
      -(entry.width * entry.height),
      fields.indexOf(entry.field),
      entry.index,
    ];

    const leftRank = rank(left);
    const rightRank = rank(right);

    for (let i = 0; i < leftRank.length; i++) {
      if (leftRank[i] !== rightRank[i]) return leftRank[i] - rightRank[i];
    }

    return 0;
  }

  private async deleteDroppedObjects(
    game: TDedupeGame,
    update: Partial<Record<TGameImageField, string[]>>,
    groups: IGameImageDuplicateGroup[]
  ) {
    const referenced = new Set<string>();
    const refId = (url?: string | null) => {
      const ref = parseS3ImageUrl(url);

      return ref ? `${ref.folder}/${ref.key}` : undefined;
    };

    for (const url of [
      game.cover,
      ...DEDUPE_FIELDS.flatMap((field) => update[field] ?? game[field] ?? []),
    ]) {
      const id = refId(url);

      if (id) referenced.add(id);
    }

    const byFolder = new Map<S3Folder, string[]>();
    const deleted: string[] = [];
    const skipped: string[] = [];

    for (const { duplicates } of groups) {
      for (const { url } of duplicates) {
        const ref = parseS3ImageUrl(url);

        if (!ref) {
          skipped.push(url);
          continue;
        }

        const id = `${ref.folder}/${ref.key}`;

        if (referenced.has(id) || deleted.includes(id)) {
          if (referenced.has(id)) skipped.push(url);
          continue;
        }

        byFolder.set(ref.folder, [
          ...(byFolder.get(ref.folder) ?? []),
          ref.key,
        ]);
        deleted.push(id);
      }
    }

    for (const [folder, keys] of byFolder) {
      await this.fileService.deleteFiles(keys, folder);
    }

    return { deleted, skipped };
  }

  private async fingerprintUrls(urls: string[]) {
    const unique = [...new Set(urls)];
    const fingerprints = new Map<string, IImageFingerprint>();
    const failures = new Map<string, string>();
    let cursor = 0;

    const worker = async () => {
      while (cursor < unique.length) {
        const url = unique[cursor++];

        try {
          const { data } = await this.httpService.axiosRef.get<ArrayBuffer>(
            url,
            { responseType: "arraybuffer", timeout: DOWNLOAD_TIMEOUT_MS }
          );

          fingerprints.set(url, await getImageFingerprint(Buffer.from(data)));
        } catch (error) {
          failures.set(
            url,
            error instanceof Error ? error.message : String(error)
          );
        }
      }
    };

    await Promise.all(
      Array.from(
        { length: Math.min(DOWNLOAD_CONCURRENCY, unique.length) },
        worker
      )
    );

    return { fingerprints, failures };
  }

  private buildBatchFilter(
    onlyMixedSources?: boolean
  ): FilterQuery<GameDocument> {
    const hasPairs = {
      $or: [
        { "screenshots.1": { $exists: true } },
        { "artworks.1": { $exists: true } },
      ],
    };

    if (!onlyMixedSources) return hasPairs;

    return {
      $and: [
        hasPairs,
        { screenshots: { $elemMatch: { $regex: "regru\\.cloud" } } },
        {
          screenshots: {
            $elemMatch: { $regex: escapeRegExp(getS3CdnUrl()) },
          },
        },
      ],
    };
  }

  private async runBatch(options: IGameImageDedupeBatchOptions) {
    const filter = this.buildBatchFilter(options.onlyMixedSources);
    let lastId = options.fromId
      ? new mongoose.Types.ObjectId(options.fromId)
      : undefined;

    while (!this.run.stopRequested) {
      const page = await this.gamesModel
        .find(lastId ? { $and: [filter, { _id: { $gt: lastId } }] } : filter)
        .sort({ _id: 1 })
        .limit(BATCH_PAGE_SIZE)
        .select("_id slug cover screenshots artworks")
        .lean<TDedupeGame[]>();

      if (!page.length) break;

      for (const game of page) {
        if (this.run.stopRequested) break;

        if (options.limit && this.run.scanned >= options.limit) {
          this.run.stopRequested = true;
          break;
        }

        try {
          const report = await this.dedupeGameDocument(game, options);

          this.run.duplicates += report.duplicates;
          this.run.unreadable += report.unreadable.length;
          this.run.deletedObjects += report.deletedObjects.length;

          if (report.duplicates) this.run.withDuplicates++;
        } catch (error) {
          if (this.run.failed.length < BATCH_MAX_FAILURES_KEPT) {
            this.run.failed.push({
              slug: game.slug,
              reason: error instanceof Error ? error.message : String(error),
            });
          }
        }

        this.run.scanned++;
        this.run.lastGameId = game._id.toString();
        this.run.lastSlug = game.slug;

        if (this.run.scanned % BATCH_LOG_EVERY === 0) {
          this.logger.log(
            `Image dedupe progress: scanned ${this.run.scanned}, games with duplicates ${this.run.withDuplicates}, duplicates ${this.run.duplicates}, deleted objects ${this.run.deletedObjects}, last ${this.run.lastSlug}`
          );
        }
      }

      lastId = page[page.length - 1]._id;
    }

    this.run.running = false;
    this.run.finishedAt = new Date().toISOString();

    this.logger.log(
      `Image dedupe finished: scanned ${this.run.scanned}, games with duplicates ${this.run.withDuplicates}, duplicates ${this.run.duplicates}, deleted objects ${this.run.deletedObjects}, failed ${this.run.failed.length}`
    );
  }
}
