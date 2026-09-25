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

export const useUpdateFavoriteCharactersMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      characterIds,
    }: {
      userId: string;
      characterIds: string[];
    }) =>
      userAPI
        .updateFavoriteCharacters(userId, characterIds)
        .then(({ data }) => data),
    onMutate: ({ characterIds }) => {
      const { profile, setProfile } = useAuthStore.getState();
      const previous = profile?.favoriteCharacters ?? [];

      if (profile) setProfile({ ...profile, favoriteCharacters: characterIds });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      const { profile, setProfile } = useAuthStore.getState();

      if (profile && context) {
        setProfile({ ...profile, favoriteCharacters: context.previous });
      }
    },
    onSuccess: ({ favoriteCharacters }, { userId }) => {
      const { profile, setProfile } = useAuthStore.getState();

      if (profile?._id === userId) setProfile({ ...profile, favoriteCharacters });

      queryClient.invalidateQueries({
        queryKey: userQueryKeys.favoriteCharacters(userId),
      });
    },
  });
};

export const useToggleFavoriteMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      gameId,
      isFavorite,
      replaceGameId,
    }: {
      userId: string;
      gameId: string;
      isFavorite: boolean;
      replaceGameId?: string;
    }) =>
      (isFavorite
        ? userAPI.removeFavorite(userId, gameId)
        : userAPI.addFavorite(userId, gameId, replaceGameId)
      ).then(({ data }) => data),
    onMutate: ({ gameId, isFavorite, replaceGameId }) => {
      const { profile, setProfile } = useAuthStore.getState();
      const previous = profile?.favorites ?? [];
      const favorites = isFavorite
        ? previous.filter((id) => id !== gameId)
        : replaceGameId
          ? previous.map((id) => (id === replaceGameId ? gameId : id))
          : [...previous, gameId];

      if (profile) setProfile({ ...profile, favorites });

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

export const useToggleFavoriteCharacterMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      userId,
      characterId,
      isFavorite,
    }: {
      userId: string;
      characterId: string;
      isFavorite: boolean;
    }) =>
      (isFavorite
        ? userAPI.removeFavoriteCharacter(userId, characterId)
        : userAPI.addFavoriteCharacter(userId, characterId)
      ).then(({ data }) => data),
    onMutate: ({ characterId, isFavorite }) => {
      const { profile, setProfile } = useAuthStore.getState();
      const previous = profile?.favoriteCharacters ?? [];
      const favoriteCharacters = isFavorite
        ? previous.filter((id) => id !== characterId)
        : [...previous, characterId];

      if (profile) setProfile({ ...profile, favoriteCharacters });

      return { previous };
    },
    onError: (_error, _variables, context) => {
      const { profile, setProfile } = useAuthStore.getState();

      if (profile && context) {
        setProfile({ ...profile, favoriteCharacters: context.previous });
      }
    },
    onSuccess: ({ favoriteCharacters }, { userId }) => {
      const { profile, setProfile } = useAuthStore.getState();

      if (profile?._id === userId) {
        setProfile({ ...profile, favoriteCharacters });
      }

      queryClient.invalidateQueries({
        queryKey: userQueryKeys.favoriteCharacters(userId),
      });
    },
  });
};
