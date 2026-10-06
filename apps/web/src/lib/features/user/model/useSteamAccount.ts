import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listQueryKeys } from "@/src/lib/entities/list/api";
import { userQueryKeys } from "@/src/lib/entities/user/api/user.query-keys";
import { playthroughQueryKeys } from "@/src/lib/entities/playthrough/api/playthrough.query-keys";
import { steamAPI, userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

const useAfterSteamChange = () => {
  const queryClient = useQueryClient();

  return async () => {
    const profile = useAuthStore.getState().profile;

    await queryClient.invalidateQueries({ queryKey: listQueryKeys.all });
    await queryClient.invalidateQueries({
      queryKey: [...userQueryKeys.all, "steam-library"],
    });

    if (!profile) return;

    const { data } = await userAPI.getById(profile._id);

    useAuthStore.getState().setProfile(data);
  };
};

export const useSteamLoginMutation = () =>
  useMutation({
    mutationFn: () => steamAPI.getLoginUrl().then(({ data }) => data.url),
    onSuccess: (url) => window.location.assign(url),
  });

export const useSteamLinkMutation = () => {
  const refresh = useAfterSteamChange();

  return useMutation({
    mutationFn: (params: Record<string, string>) =>
      steamAPI.link({ params }).then(({ data }) => data),
    onSuccess: () => {
      void refresh();
    },
  });
};

export const useSteamSyncMutation = () => {
  const refresh = useAfterSteamChange();

  return useMutation({
    mutationFn: () => steamAPI.sync().then(({ data }) => data),
    onSuccess: () => {
      void refresh();
    },
  });
};

export const useSteamUnlinkMutation = () => {
  const refresh = useAfterSteamChange();

  return useMutation({
    mutationFn: () => steamAPI.unlink().then(({ data }) => data),
    onSuccess: () => {
      void refresh();
    },
  });
};

export const useSteamPlaythroughsToggleMutation = () => {
  const refresh = useAfterSteamChange();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isOn: boolean) => {
      const profile = useAuthStore.getState().profile;

      if (!profile) return null;

      await userAPI.updateSettings(profile._id, {
        steamSyncPlaythroughs: isOn,
      });

      return isOn ? steamAPI.syncPlaythroughs().then(({ data }) => data) : null;
    },
    onSuccess: () => {
      void refresh();
      void queryClient.invalidateQueries({
        queryKey: playthroughQueryKeys.all,
      });
    },
  });
};
