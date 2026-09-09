import { playthroughsAPI } from "@/src/lib/shared/api";
import {
  IPlaythrough,
  IPlaythroughMinimal,
  ISavePlaythroughRequest,
  IUpdatePlaythroughRequest,
} from "@/src/lib/shared/lib/schemas/playthroughs.schema";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { playthroughQueryKeys } from "./playthrough.query-keys";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { usePlaythroughsStore } from "@/src/lib/shared/store/playthroughs.store";

export const useCreatePlaythroughMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (playthrough: ISavePlaythroughRequest) =>
      playthroughsAPI.create(playthrough).then(({ data }) => data),
    onSuccess: (playthrough: IPlaythrough) => {
      queryClient.setQueryData(
        playthroughQueryKeys.list(playthrough.userId, playthrough.gameId),
        (current: IPlaythrough[] | undefined) =>
          upsertFull(current, playthrough)
      );

      queryClient.setQueryData(
        playthroughQueryKeys.minimal(playthrough.userId),
        (current: IPlaythroughMinimal[] | undefined) =>
          upsertMinimal(current, playthrough)
      );

      const {
        playthroughs: userPlaythroughs,
        setPlaythroughs: setUserPlaythroughs,
      } = useUserStore.getState();
      setUserPlaythroughs(upsertMinimal(userPlaythroughs, playthrough));

      const {
        playthroughs: fullPlaythroughs,
        setPlaythroughs: setFullPlaythroughs,
      } = usePlaythroughsStore.getState();
      setFullPlaythroughs(upsertFull(fullPlaythroughs, playthrough));
    },
  });
};

export const useDeletePlaythroughMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      playthroughId,
    }: {
      userId: string;
      playthroughId: string;
    }) =>
      playthroughsAPI.remove(userId, playthroughId).then(({ data }) => data),

    onSuccess: (playthrough: IPlaythrough) => {
      queryClient.setQueryData(
        playthroughQueryKeys.list(playthrough.userId, playthrough.gameId),
        (current: IPlaythrough[] | undefined) =>
          current?.filter((item) => item._id !== playthrough._id) ?? []
      );
      queryClient.setQueryData(
        playthroughQueryKeys.minimal(playthrough.userId),
        (current: IPlaythroughMinimal[] | undefined) =>
          current?.filter((item) => item._id !== playthrough._id) ?? []
      );

      const {
        playthroughs: userPlaythroughs,
        setPlaythroughs: setUserPlaythroughs,
      } = useUserStore.getState();
      setUserPlaythroughs(
        userPlaythroughs?.filter((item) => item._id !== playthrough._id) ?? []
      );

      const {
        playthroughs: fullPlaythroughs,
        setPlaythroughs: setFullPlaythroughs,
      } = usePlaythroughsStore.getState();
      setFullPlaythroughs(
        fullPlaythroughs?.filter((item) => item._id !== playthrough._id) ?? []
      );
    },
  });
};

export const useUpdatePlaythroughMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      userId,
      playthroughId,
      playthrough,
    }: {
      userId: string;
      playthroughId: string;
      playthrough: IUpdatePlaythroughRequest;
    }) =>
      playthroughsAPI
        .update(userId, playthroughId, playthrough)
        .then(({ data }) => data),

    onSuccess: (playthrough: IPlaythrough) => {
      queryClient.setQueryData(
        playthroughQueryKeys.list(playthrough.userId, playthrough.gameId),
        (current: IPlaythrough[] | undefined) =>
          upsertFull(current, playthrough)
      );
      queryClient.setQueryData(
        playthroughQueryKeys.minimal(playthrough.userId),
        (current: IPlaythroughMinimal[] | undefined) =>
          upsertMinimal(current, playthrough)
      );

      const {
        playthroughs: userPlaythroughs,
        setPlaythroughs: setUserPlaythroughs,
      } = useUserStore.getState();
      setUserPlaythroughs(upsertMinimal(userPlaythroughs, playthrough));

      const {
        playthroughs: fullPlaythroughs,
        setPlaythroughs: setFullPlaythroughs,
      } = usePlaythroughsStore.getState();
      setFullPlaythroughs(upsertFull(fullPlaythroughs, playthrough));
    },
  });
};

const toMinimal = (playthrough: IPlaythrough): IPlaythroughMinimal => ({
  _id: playthrough._id,
  category: playthrough.category,
  gameId: playthrough.gameId,
  isMastered: playthrough.isMastered,
  updatedAt: playthrough.updatedAt,
});

const upsertMinimal = (
  current: IPlaythroughMinimal[] | undefined,
  playthrough: IPlaythrough
) => {
  const minimal = toMinimal(playthrough);
  if (!current) return [minimal];

  const exists = current.some((item) => item._id === minimal._id);
  return exists
    ? current.map((item) => (item._id === minimal._id ? minimal : item))
    : [...current, minimal];
};

const upsertFull = (
  current: IPlaythrough[] | undefined,
  playthrough: IPlaythrough
) => {
  if (!current) return [playthrough];

  const exists = current.some((item) => item._id === playthrough._id);
  return exists
    ? current.map((item) =>
        item._id === playthrough._id ? playthrough : item
      )
    : [...current, playthrough];
};
