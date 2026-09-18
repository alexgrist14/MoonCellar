import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { InjectConnection } from "@nestjs/mongoose";
import type { Connection } from "mongoose";
import { FileService } from "../../user/services/file-upload.service";
import { S3_FOLDERS, parseS3ImageUrl, type S3Folder } from "../../../shared/s3";
import {
  type IImageOrphansFolderResult,
  type IImageOrphansOptions,
  type IImageOrphansRun,
} from "../interface/image-orphans.interface";

const GAME_IMAGE_FOLDERS: S3Folder[] = [
  S3_FOLDERS.covers,
  S3_FOLDERS.screenshots,
  S3_FOLDERS.artworks,
];

const RICH_TEXT_SOURCES = [
  { collection: "gamecomments", field: "body" },
  { collection: "playthroughs", field: "comment" },
  { collection: "userlogs", field: "text" },
];

const URL_PATTERN = /https?:\/\/[^\s"'<>)\\]+/g;
const DAY_MS = 24 * 60 * 60 * 1000;
const DEFAULT_MIN_AGE_DAYS = 7;
const DEFAULT_MAX_DELETE_RATIO = 0.2;
const DEFAULT_SAMPLE_LIMIT = 50;
const MAX_ORPHANS_COLLECTED = 500000;
const DELETE_BATCH_SIZE = 1000;
const SCAN_LOG_EVERY = 100000;

@Injectable()
export class ImageOrphansService {
  private readonly logger = new Logger(ImageOrphansService.name);
  private run?: IImageOrphansRun;

  constructor(
    @InjectConnection() private readonly connection: Connection,
    private readonly fileService: FileService
  ) {}

  getState() {
    if (!this.run) throw new NotFoundException("No orphan scan recorded");

    return this.run;
  }

  start(options: IImageOrphansOptions) {
    if (this.run?.running) {
      throw new ConflictException("An orphan scan is already running");
    }

    const folders = options.folders?.length
      ? options.folders
      : GAME_IMAGE_FOLDERS;
    const unknown = folders.filter(
      (folder) => !GAME_IMAGE_FOLDERS.includes(folder)
    );

    if (unknown.length) {
      throw new BadRequestException(
        `Only game image folders can be scanned: ${GAME_IMAGE_FOLDERS.join(", ")}`
      );
    }

    const minAgeDays = options.minAgeDays ?? DEFAULT_MIN_AGE_DAYS;

    if (!Number.isFinite(minAgeDays) || minAgeDays < 0) {
      throw new BadRequestException("minAgeDays must be a number >= 0");
    }

    const maxDeleteRatio = options.maxDeleteRatio ?? DEFAULT_MAX_DELETE_RATIO;

    if (!Number.isFinite(maxDeleteRatio) || maxDeleteRatio <= 0) {
      throw new BadRequestException("maxDeleteRatio must be a number > 0");
    }

    const startedAt = new Date();
    const resolved: IImageOrphansOptions = {
      ...options,
      folders,
      minAgeDays,
      maxDeleteRatio,
      sampleLimit: options.sampleLimit ?? DEFAULT_SAMPLE_LIMIT,
    };

    this.run = {
      running: true,
      stopRequested: false,
      phase: "referencing",
      startedAt: startedAt.toISOString(),
      options: resolved,
      cutoff: new Date(
        Math.min(startedAt.getTime(), Date.now() - minAgeDays * DAY_MS)
      ).toISOString(),
      gamesScanned: 0,
      referencedKeys: 0,
      folders: [],
    };

    void this.runScan(resolved).catch((error) => {
      this.logger.error(error, "Orphan scan failed");

      if (this.run) {
        this.run.error = error instanceof Error ? error.message : String(error);
        this.run.running = false;
        this.run.phase = "finished";
        this.run.finishedAt = new Date().toISOString();
      }
    });

    return this.run;
  }

  stop() {
    if (!this.run?.running) {
      throw new ConflictException("No orphan scan in progress");
    }

    this.run.stopRequested = true;

    return this.run;
  }

  private async collectReferencedKeys(folders: S3Folder[]) {
    const referenced = new Map<S3Folder, Set<string>>(
      folders.map((folder) => [folder, new Set<string>()])
    );

    const add = (url?: string | null) => {
      const ref = parseS3ImageUrl(url);

      if (ref) referenced.get(ref.folder)?.add(ref.key);
    };

    const games = this.connection
      .collection("games")
      .find({}, { projection: { cover: 1, screenshots: 1, artworks: 1 } });

    for await (const game of games) {
      add(game.cover as string);

      for (const url of (game.screenshots as string[]) ?? []) add(url);
      for (const url of (game.artworks as string[]) ?? []) add(url);

      this.run.gamesScanned++;

      if (this.run.gamesScanned % SCAN_LOG_EVERY === 0) {
        this.logger.log(
          `Orphan scan: read ${this.run.gamesScanned} games for references`
        );
      }

      if (this.run.stopRequested) break;
    }

    for (const { collection, field } of RICH_TEXT_SOURCES) {
      const documents = this.connection
        .collection(collection)
        .find(
          { [field]: { $regex: "https?://" } },
          { projection: { [field]: 1 } }
        );

      for await (const document of documents) {
        for (const url of String(document[field] ?? "").match(URL_PATTERN) ??
          []) {
          add(url);
        }
      }
    }

    this.run.referencedKeys = [...referenced.values()].reduce(
      (total, keys) => total + keys.size,
      0
    );

    return referenced;
  }

  private async scanFolder(
    folder: S3Folder,
    referenced: Set<string>,
    options: IImageOrphansOptions,
    cutoff: Date
  ) {
    const result: IImageOrphansFolderResult = {
      folder,
      objects: 0,
      referenced: referenced.size,
      orphans: 0,
      tooRecent: 0,
      deleted: 0,
      sample: [],
    };

    this.run.folders.push(result);

    if (!referenced.size) {
      result.refusedReason =
        "no referenced keys were found for this folder, refusing to treat every object as an orphan";

      return result;
    }

    const orphans: string[] = [];
    let overflowed = false;

    for await (const page of this.fileService.iterateObjects(
      folder,
      options.prefix
    )) {
      if (this.run.stopRequested) break;

      for (const { key, lastModified } of page) {
        result.objects++;

        if (referenced.has(key)) continue;

        if (!lastModified || lastModified >= cutoff) {
          result.tooRecent++;
          continue;
        }

        result.orphans++;

        if (result.sample.length < options.sampleLimit) result.sample.push(key);

        if (orphans.length < MAX_ORPHANS_COLLECTED) {
          orphans.push(key);
        } else {
          overflowed = true;
        }
      }
    }

    if (this.run.stopRequested) {
      result.refusedReason = "stopped before the folder was fully scanned";

      return result;
    }

    if (!options.apply) return result;

    if (overflowed) {
      result.refusedReason = `more than ${MAX_ORPHANS_COLLECTED} orphans, narrow the run with prefix before deleting`;

      return result;
    }

    const ratio = result.objects ? result.orphans / result.objects : 0;

    if (ratio > options.maxDeleteRatio) {
      result.refusedReason = `orphans are ${(ratio * 100).toFixed(1)}% of the folder, above maxDeleteRatio ${options.maxDeleteRatio}`;

      return result;
    }

    this.run.phase = "deleting";

    for (let i = 0; i < orphans.length; i += DELETE_BATCH_SIZE) {
      await this.fileService.deleteFiles(
        orphans.slice(i, i + DELETE_BATCH_SIZE),
        folder
      );

      result.deleted += Math.min(DELETE_BATCH_SIZE, orphans.length - i);
    }

    this.run.phase = "scanning";

    return result;
  }

  private async runScan(options: IImageOrphansOptions) {
    const cutoff = new Date(this.run.cutoff);
    const referenced = await this.collectReferencedKeys(options.folders);

    this.logger.log(
      `Orphan scan: ${this.run.referencedKeys} referenced keys from ${this.run.gamesScanned} games, cutoff ${this.run.cutoff}`
    );

    this.run.phase = "scanning";

    for (const folder of options.folders) {
      if (this.run.stopRequested) break;

      const result = await this.scanFolder(
        folder,
        referenced.get(folder),
        options,
        cutoff
      );

      this.logger.log(
        `Orphan scan ${folder}: ${result.objects} objects, ${result.referenced} referenced, ${result.orphans} orphans, ${result.tooRecent} newer than the cutoff, ${result.deleted} deleted${result.refusedReason ? ` (${result.refusedReason})` : ""}`
      );
    }

    this.run.running = false;
    this.run.phase = "finished";
    this.run.finishedAt = new Date().toISOString();
  }
}
