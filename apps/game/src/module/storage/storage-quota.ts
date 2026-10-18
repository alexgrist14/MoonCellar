import type { IGameStorageBucket } from "../../games/game-definition";

export type IStorageUsage = {
  files: number;
  bytes: number;
};

export const quotaProblem = (
  limits: IGameStorageBucket,
  usage: IStorageUsage,
  replacedBytes: number | null,
  size: number
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
  return null;
};
