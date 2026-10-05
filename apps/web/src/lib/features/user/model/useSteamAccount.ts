import { useMutation, useQueryClient } from "@tanstack/react-query";
import { listQueryKeys } from "@/src/lib/entities/list/api";
import { steamAPI, userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

const useAfterSteamChange = () => {
  const queryClient = useQueryClient();

  return async () => {
    const profile = useAuthStore.getState().profile;

    await queryClient.invalidateQueries({ queryKey: listQueryKeys.all });

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
    onSuccess: refresh,
  });
};

export const useSteamSyncMutation = () => {
  const refresh = useAfterSteamChange();

  return useMutation({
    mutationFn: () => steamAPI.sync().then(({ data }) => data),
    onSuccess: refresh,
  });
};

export const useSteamUnlinkMutation = () => {
  const refresh = useAfterSteamChange();

  return useMutation({
    mutationFn: () => steamAPI.unlink().then(({ data }) => data),
    onSuccess: refresh,
  });
};
