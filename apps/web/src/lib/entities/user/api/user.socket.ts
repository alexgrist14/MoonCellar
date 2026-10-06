import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ActivitySocketEvent,
  IActivityChangedEvent,
} from "@mooncellar/schemas";
import {
  followActivity,
  getActivitySocket,
} from "@/src/lib/shared/socket/activity.socket";
import { userQueryKeys } from "./user.query-keys";

export const useActivitySocket = (userId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;

    const socket = getActivitySocket();
    const invalidate = () =>
      queryClient.invalidateQueries({
        queryKey: [...userQueryKeys.all, "logs", userId],
      });

    const onChanged = (event: IActivityChangedEvent) => {
      if (event.userId === userId) invalidate();
    };

    socket.on(ActivitySocketEvent.CHANGED, onChanged);
    socket.io.on("reconnect", invalidate);

    const unfollow = followActivity(userId);

    return () => {
      unfollow();
      socket.off(ActivitySocketEvent.CHANGED, onChanged);
      socket.io.off("reconnect", invalidate);
    };
  }, [userId, queryClient]);
};
