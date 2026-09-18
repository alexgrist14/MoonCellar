export type TGameImageField = "screenshots" | "artworks";

export type TImageMatchKind = "md5" | "perceptual";

export interface IGameImageEntry {
  field: TGameImageField;
  index: number;
  url: string;
  width: number;
  height: number;
}

export interface IGameImageDuplicate extends IGameImageEntry {
  matchedBy: TImageMatchKind;
  distance: number;
}

export interface IGameImageDuplicateGroup {
  keep: IGameImageEntry;
  duplicates: IGameImageDuplicate[];
}

export interface IGameImageUnreadable {
  field: TGameImageField;
  index: number;
  url: string;
  reason: string;
}

export interface IGameImageDedupeOptions {
  apply?: boolean;
  deleteObjects?: boolean;
  threshold?: number;
  fields?: TGameImageField[];
}

export interface IGameImageDedupeReport {
  gameId: string;
  slug: string;
  applied: boolean;
  deletedObjectsEnabled: boolean;
  threshold: number;
  checked: number;
  duplicates: number;
  groups: IGameImageDuplicateGroup[];
  unreadable: IGameImageUnreadable[];
  skippedObjects: string[];
  deletedObjects: string[];
}

export interface IGameImageDedupeBatchOptions extends IGameImageDedupeOptions {
  limit?: number;
  fromId?: string;
  onlyMixedSources?: boolean;
}

export interface IGameImageDedupeRun {
  running: boolean;
  stopRequested: boolean;
  startedAt: string;
  finishedAt?: string;
  options: IGameImageDedupeBatchOptions;
  scanned: number;
  withDuplicates: number;
  duplicates: number;
  unreadable: number;
  deletedObjects: number;
  lastGameId?: string;
  lastSlug?: string;
  failed: { slug: string; reason: string }[];
}
