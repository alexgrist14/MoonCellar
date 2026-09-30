import { type S3Folder } from "../../../shared/s3";

export interface IFileOrphansOptions {
  apply?: boolean;
  folders?: S3Folder[];
  prefix?: string;
  minAgeDays?: number;
  maxDeleteRatio?: number;
  sampleLimit?: number;
}

export interface IFileOrphansFolderResult {
  folder: S3Folder;
  objects: number;
  referenced: number;
  orphans: number;
  tooRecent: number;
  deleted: number;
  refusedReason?: string;
  sample: string[];
}

export interface IFileOrphansRun {
  running: boolean;
  stopRequested: boolean;
  phase: "referencing" | "scanning" | "deleting" | "finished";
  startedAt: string;
  finishedAt?: string;
  options: IFileOrphansOptions;
  cutoff: string;
  documentsScanned: number;
  referencedKeys: number;
  folders: IFileOrphansFolderResult[];
  error?: string;
}
