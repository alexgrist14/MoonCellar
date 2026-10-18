import { useQuery } from "@tanstack/react-query";
import { portAchievementsApi } from "@/src/lib/shared/api";
import { portAchievementQueryKeys } from "./port-achievement.query-keys";

export const usePortGamesQuery = (isEnabled = true) =>
  useQuery({
    queryKey: portAchievementQueryKeys.games(),
    queryFn: () => portAchievementsApi.getGames().then(({ data }) => data),
    enabled: isEnabled,
    staleTime: 60 * 60 * 1000,
  });

export const usePortPlayerAchievementsQuery = (game: string, userId?: string) =>
  useQuery({
    queryKey: portAchievementQueryKeys.player(game, userId ?? ""),
    queryFn: () =>
      portAchievementsApi
        .getPlayerAchievements(game, userId!)
        .then(({ data }) => data),
    enabled: !!userId,
    staleTime: 60000,
  });

export const usePortPlayerGamesQuery = (userId: string) =>
  useQuery({
    queryKey: portAchievementQueryKeys.playerGames(userId),
    queryFn: () =>
      portAchievementsApi.getPlayerGames(userId).then(({ data }) => data),
    staleTime: 60000,
  });
