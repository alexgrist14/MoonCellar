export const userQueryKeys = {
  all: ["user"] as const,
  logs: (userId: string, page: number, take: number) =>
    [...userQueryKeys.all, "logs", userId, page, take] as const,
  filters: (userId: string) =>
    [...userQueryKeys.all, "filters", userId] as const,
  presets: (userId: string) =>
    [...userQueryKeys.all, "presets", userId] as const,
};
