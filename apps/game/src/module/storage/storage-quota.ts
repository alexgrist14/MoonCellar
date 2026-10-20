import type { IGameStorageBucket } from "../../games/game-definition";

export type IStorageUsage = {
  files: number;
  bytes: number;
  folders?: string[];
};

export const folderOf = (path: string): string | null => {
  const slash = path.indexOf("/");
  return slash === -1 ? null : path.slice(0, slash);
};

export const quotaProblem = (
  limits: IGameStorageBucket,
  usage: IStorageUsage,
  replacedBytes: number | null,
  size: number,
  path = ""
): string | null => {
  if (size > limits.maxFileBytes) {
    return `The file is larger than ${limits.maxFileBytes / 1024} KiB`;
  }
  if (replacedBytes === null && usage.files >= limits.maxFiles) {
    return `The storage already holds ${limits.maxFiles} files. Delete one to add another`;
  }
  if (usage.bytes - (replacedBytes ?? 0) + size > limits.maxBytes) {
    return `The storage would exceed ${limits.maxBytes / (1024 * 1024)} MiB`;
  }
  const folder = folderOf(path);
  const folders = usage.folders ?? [];
  if (
    limits.maxFolders !== undefined &&
    folder !== null &&
    !folders.includes(folder) &&
    folders.length >= limits.maxFolders
  ) {
    return `The storage already holds ${limits.maxFolders} folders. Delete one to add another`;
  }
  return null;
};
