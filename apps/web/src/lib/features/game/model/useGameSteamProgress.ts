import { useMemo } from "react";
import { IGameResponse } from "@mooncellar/schemas";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

export const useGameSteamProgress = (game: IGameResponse) => {
  const profile = useAuthStore((s) => s.profile);

  const progress = useMemo(() => {
    const entries = profile?.steam?.achievements?.filter(
      ({ unlocked }) => unlocked > 0
    );

    return (
      entries?.find(({ gameId }) => gameId === game._id) ??
      entries?.find(({ appId }) => appId === game.steamAchievements?.appId)
    );
  }, [game._id, game.steamAchievements?.appId, profile]);

  return {
    progress,
    total: progress?.total ?? game.steamAchievements?.total ?? 0,
    appId: progress?.appId ?? game.steamAchievements?.appId,
    isMastered: !!progress && progress.unlocked >= progress.total,
    steamId: profile?.steam?.steamId,
  };
};
