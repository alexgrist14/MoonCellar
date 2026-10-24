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

export const usePortAchievementsQuery = (game: string, isEnabled = true) =>
  useQuery({
    queryKey: portAchievementQueryKeys.achievements(game),
    queryFn: () =>
      portAchievementsApi.getAchievements(game).then(({ data }) => data),
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

export const usePortPlayerGamesQuery = (userId: string, isEnabled = true) =>
  useQuery({
    queryKey: portAchievementQueryKeys.playerGames(userId),
    queryFn: () =>
      portAchievementsApi.getPlayerGames(userId).then(({ data }) => data),
    enabled: isEnabled && !!userId,
    staleTime: 60000,
  });

export const usePortGameProgress = (siteGame: string, viewerId?: string) => {
  const { data: ports } = usePortGamesQuery();
  const port = ports?.find(
    (item) => item.siteGame === siteGame && item.achievements > 0
  );
  const { data: viewerGames } = usePortPlayerGamesQuery(viewerId ?? "", !!port);

  return {
    port,
    progress: viewerGames?.find((item) => item.game === port?.slug),
  };
};
