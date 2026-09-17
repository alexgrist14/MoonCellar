import { useMutation, useQueryClient } from "@tanstack/react-query";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { userQueryKeys } from "./user.query-keys";

export const useUpdateFavoritesMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, gameIds }: { userId: string; gameIds: string[] }) =>
      userAPI.updateFavorites(userId, gameIds).then(({ data }) => data),
    onMutate: ({ gameIds }) => {
      const { profile, setProfile } = useAuthStore.getState();
      const previous = profile?.favorites ?? [];

      if (profile) setProfile({ ...profile, favorites: gameIds });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      const { profile, setProfile } = useAuthStore.getState();

      if (profile && context) {
        setProfile({ ...profile, favorites: context.previous });
      }
    },
    onSuccess: ({ favorites }, { userId }) => {
      const { profile, setProfile } = useAuthStore.getState();

      if (profile?._id === userId) setProfile({ ...profile, favorites });

      queryClient.invalidateQueries({
        queryKey: [...userQueryKeys.all, "logs", userId],
      });
    },
  });
};
