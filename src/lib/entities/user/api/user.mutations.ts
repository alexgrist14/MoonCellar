import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { IUserFilter, IUserPreset } from "@/src/lib/shared/types/user.type";
import { userQueryKeys } from "./user.query-keys";

interface IUpdateProfileRequest {
  userId: string;
  description?: string;
  avatar?: File;
  raUsername?: string;
  background?: File;
  settings?: { showAdultContent: boolean };
}

export const useUpdateProfileMutation = () =>
  useMutation({
    mutationFn: async ({
      userId,
      description,
      avatar,
      raUsername,
      background,
      settings,
    }: IUpdateProfileRequest) => {
      const calls: Promise<unknown>[] = [];

      if (description !== undefined) {
        calls.push(userAPI.updateDescription(userId, { description }));
      }
      if (avatar) {
        calls.push(userAPI.addAvatar(userId, avatar));
      }
      if (raUsername) {
        calls.push(userAPI.setRaUserInfo(userId, raUsername));
      }
      if (background) {
        calls.push(userAPI.addBackground(userId, background));
      }
      if (settings) {
        calls.push(userAPI.updateSettings(userId, settings));
      }

      await Promise.all(calls);

      return userAPI.getById(userId).then(({ data }) => data);
    },
    onSuccess: (user) => {
      useAuthStore.getState().setProfile(user);
    },
  });

export const useAddUserFollowingMutation = () =>
  useMutation({
    mutationFn: ({
      userId,
      followingId,
    }: {
      userId: string;
      followingId: string;
    }) => userAPI.addUserFollowing(userId, followingId).then(({ data }) => data),
  });

export const useRemoveUserFollowingMutation = () =>
  useMutation({
    mutationFn: ({
      userId,
      followingId,
    }: {
      userId: string;
      followingId: string;
    }) =>
      userAPI.removeUserFollowing(userId, followingId).then(({ data }) => data),
  });

export const useAddUserFilterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, filter }: { userId: string; filter: IUserFilter }) =>
      userAPI.addFilter(userId, filter).then(({ data }) => data),
    onSuccess: (user) => {
      queryClient.setQueryData(
        userQueryKeys.filters(user._id),
        user.filters ?? []
      );
    },
  });
};

export const useRemoveUserFilterMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, name }: { userId: string; name: string }) =>
      userAPI.removeFilter(userId, name).then(({ data }) => data),
    onSuccess: (user) => {
      queryClient.setQueryData(
        userQueryKeys.filters(user._id),
        user.filters ?? []
      );
    },
  });
};

export const useAddUserPresetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, preset }: { userId: string; preset: IUserPreset }) =>
      userAPI.addPreset(userId, preset).then(({ data }) => data),
    onSuccess: (user) => {
      queryClient.setQueryData(
        userQueryKeys.presets(user._id),
        user.presets ?? []
      );
    },
  });
};

export const useRemoveUserPresetMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, name }: { userId: string; name: string }) =>
      userAPI.removePreset(userId, name).then(({ data }) => data),
    onSuccess: (user) => {
      queryClient.setQueryData(
        userQueryKeys.presets(user._id),
        user.presets ?? []
      );
    },
  });
};
