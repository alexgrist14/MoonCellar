export const portAchievementQueryKeys = {
  all: ["port-achievements"] as const,
  games: () => [...portAchievementQueryKeys.all, "games"] as const,
  player: (game: string, userId: string) =>
    [...portAchievementQueryKeys.all, "player", game, userId] as const,
  playerGames: (userId: string) =>
    [...portAchievementQueryKeys.all, "player-games", userId] as const,
};
