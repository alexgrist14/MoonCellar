import { useMemo } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { userAPI } from "@/src/lib/shared/api";
import {
  useAddUserFollowingMutation,
  useRemoveUserFollowingMutation,
} from "@/src/lib/entities/user/api/user.mutations";
import { userQueryKeys } from "@/src/lib/entities/user/api/user.query-keys";
import { IFollowings } from "@/src/lib/shared/types/user.type";

const viewerFollowingsKey = (viewerId?: string) =>
  [...userQueryKeys.all, "viewer-followings", viewerId ?? ""] as const;

export const useViewerFollowings = (
  viewerId?: string,
  initialData?: IFollowings
) => {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: viewerFollowingsKey(viewerId),
    queryFn: () =>
      userAPI.getUserFollowings(viewerId as string).then(({ data }) => data),
    enabled: !!viewerId,
    initialData: viewerId ? initialData : undefined,
    staleTime: 60000,
  });

  const { mutate: addFollowing, isPending: isAdding } =
    useAddUserFollowingMutation();
  const { mutate: removeFollowing, isPending: isRemoving } =
    useRemoveUserFollowingMutation();

  const followingIds = useMemo(
    () => new Set((data?.followings ?? []).map((user) => user._id)),
    [data]
  );

  const toggleFollowing = (targetId: string) => {
    if (!viewerId || viewerId === targetId) return;

    const mutate = followingIds.has(targetId) ? removeFollowing : addFollowing;

    mutate(
      { userId: viewerId, followingId: targetId },
      {
        onSuccess: (followings) =>
          queryClient.setQueryData(viewerFollowingsKey(viewerId), followings),
      }
    );
  };

  return {
    followingIds,
    toggleFollowing,
    isBusy: isAdding || isRemoving,
  };
};
