import { useMutation } from "@tanstack/react-query";
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

export const useRaSyncMutation = () =>
  useMutation({
    mutationFn: () => userAPI.syncRa().then(({ data }) => data),
    onSuccess: () => refreshProfile(),
  });

export const useRaDisconnectMutation = () =>
  useMutation({
    mutationFn: () => userAPI.disconnectRa(),
    onSuccess: () => refreshProfile(),
  });
