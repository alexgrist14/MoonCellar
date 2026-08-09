export const playthroughQueryKeys = {
  all: ["playthroughs"] as const,
  list: (userId: string, gameId: string) => [
    ...playthroughQueryKeys.all,
    "game",
    userId,
    gameId,
  ],
  minimal: (userId: string) =>
    [...playthroughQueryKeys.all, "minimal", userId] as const,
};
