import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  ConflictsSocketEvent,
  IConflictDecidedEvent,
  IConflictItemResponse,
  IConflictsAppliedEvent,
} from "@mooncellar/schemas";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import {
  createConflictsSocket,
  IConflictsSocket,
} from "@/src/lib/shared/socket/conflicts.socket";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { conflictQueryKeys } from "./conflict.query-keys";

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

export const useConflictsSocket = (openExternalId: string | null) => {
  const queryClient = useQueryClient();
  const openExternalIdRef = useRef(openExternalId);

  useEffect(() => {
    openExternalIdRef.current = openExternalId;
  }, [openExternalId]);

  useEffect(() => {
    let socket: IConflictsSocket | undefined;
    let isCancelled = false;
    let isRefreshTried = false;

    const refreshOverview = () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: conflictQueryKeys.summaryAll(),
        }),
        queryClient.invalidateQueries({
          queryKey: conflictQueryKeys.listAll(),
        }),
      ]);

    const onDecided = ({
      source,
      externalId,
      state,
      decidedBy,
    }: IConflictDecidedEvent) => {
      const queryKey = conflictQueryKeys.item(source, externalId);
      const wasWaiting =
        queryClient.getQueryData<IConflictItemResponse>(queryKey)?.item
          ?.state === "waiting";

      refreshOverview();

      if (state === "waiting") {
        queryClient.invalidateQueries({ queryKey });
        return;
      }

      queryClient.setQueryData<IConflictItemResponse>(queryKey, (response) =>
        response?.item
          ? { item: { ...response.item, state, decidedBy } }
          : response
      );

      if (wasWaiting && externalId === openExternalIdRef.current) {
        toast.error({
          title: "Already decided",
          description: `${decidedBy ?? "Another admin"} decided ${externalId} while you were reviewing it`,
        });
      }
    };

    const onApplied = ({ source, externalIds }: IConflictsAppliedEvent) => {
      externalIds.forEach((externalId) =>
        queryClient.invalidateQueries({
          queryKey: conflictQueryKeys.item(source, externalId),
        })
      );
      refreshOverview();
    };

    const onReconnect = () =>
      queryClient.invalidateQueries({ queryKey: conflictQueryKeys.all });

    const onConnectError = (error: Error) => {
      if (error.message !== UNAUTHORIZED_SOCKET_ERROR || isRefreshTried) return;

      isRefreshTried = true;

      refreshAuth().then(() => {
        if (!isCancelled) socket?.connect();
      });
    };

    createConflictsSocket()
      .then((conflictsSocket) => {
        if (isCancelled) return;

        socket = conflictsSocket;
        conflictsSocket.on(ConflictsSocketEvent.CONFLICT_DECIDED, onDecided);
        conflictsSocket.on(ConflictsSocketEvent.CONFLICTS_APPLIED, onApplied);
        conflictsSocket.on("connect_error", onConnectError);
        conflictsSocket.io.on("reconnect", onReconnect);
        conflictsSocket.connect();
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      socket?.io.off("reconnect", onReconnect);
      socket?.disconnect();
    };
  }, [queryClient]);
};
