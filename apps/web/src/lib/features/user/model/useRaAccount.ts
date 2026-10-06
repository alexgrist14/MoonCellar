import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playthroughQueryKeys } from "@/src/lib/entities/playthrough/api/playthrough.query-keys";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";

const refreshProfile = async () => {
  const profile = useAuthStore.getState().profile;

  if (!profile) return;

  const { data } = await userAPI.getById(profile._id);

  useAuthStore.getState().setProfile(data);
};

export const useRaConnectMutation = () =>
  useMutation({
    mutationFn: (username: string) =>
      userAPI.connectRa(username).then(({ data }) => data),
    onSuccess: () => refreshProfile(),
  });

export const useRaVerifyMutation = () =>
  useMutation({
    mutationFn: () => userAPI.verifyRa().then(({ data }) => data),
    onSuccess: () => refreshProfile(),
  });

export const useRaSyncMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => userAPI.syncRa().then(({ data }) => data),
    onSuccess: () => {
      void refreshProfile();
      void queryClient.invalidateQueries({
        queryKey: playthroughQueryKeys.all,
      });
    },
  });
};

export const useRaPlaythroughsToggleMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (isOn: boolean) => {
      const profile = useAuthStore.getState().profile;

      if (!profile) return null;

      await userAPI.updateSettings(profile._id, { raSyncPlaythroughs: isOn });

      return isOn
        ? userAPI.syncRaPlaythroughs().then(({ data }) => data)
        : null;
    },
    onSuccess: () => {
      void refreshProfile();
      void queryClient.invalidateQueries({
        queryKey: playthroughQueryKeys.all,
      });
    },
  });
};

export const useRaDisconnectMutation = () =>
  useMutation({
    mutationFn: () => userAPI.disconnectRa(),
    onSuccess: () => refreshProfile(),
  });
