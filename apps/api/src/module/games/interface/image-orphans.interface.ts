import { type S3Folder } from "../../../shared/s3";

export interface IImageOrphansOptions {
  apply?: boolean;
  folders?: S3Folder[];
  prefix?: string;
  minAgeDays?: number;
  maxDeleteRatio?: number;
  sampleLimit?: number;
}

export interface IImageOrphansFolderResult {
  folder: S3Folder;
  objects: number;
  referenced: number;
  orphans: number;
  tooRecent: number;
  deleted: number;
  refusedReason?: string;
  sample: string[];
}

export interface IImageOrphansRun {
  running: boolean;
  stopRequested: boolean;
  phase: "referencing" | "scanning" | "deleting" | "finished";
  startedAt: string;
  finishedAt?: string;
  options: IImageOrphansOptions;
  cutoff: string;
  gamesScanned: number;
  referencedKeys: number;
  folders: IImageOrphansFolderResult[];
  error?: string;
}
