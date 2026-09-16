import { useEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  IVndbCandidateDecidedEvent,
  IVndbCandidatesAppliedEvent,
  IVndbReviewItemResponse,
  VndbReviewSocketEvent,
} from "@mooncellar/schemas";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import {
  createVndbReviewSocket,
  IVndbReviewSocket,
} from "@/src/lib/shared/socket/vndb-review.socket";
import { toast } from "@/src/lib/shared/utils/toast.utils";
import { vndbCandidateQueryKeys } from "./vndb-candidates.query-keys";

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

export const useVndbReviewSocket = (openVnId: string | null) => {
  const queryClient = useQueryClient();
  const openVnIdRef = useRef(openVnId);

  useEffect(() => {
    openVnIdRef.current = openVnId;
  }, [openVnId]);

  useEffect(() => {
    let socket: IVndbReviewSocket | undefined;
    let isCancelled = false;
    let isRefreshTried = false;

    const refreshOverview = () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: vndbCandidateQueryKeys.summary(),
        }),
        queryClient.invalidateQueries({
          queryKey: vndbCandidateQueryKeys.listAll(),
        }),
      ]);

    const onDecided = ({ vnId, state, decidedBy }: IVndbCandidateDecidedEvent) => {
      const queryKey = vndbCandidateQueryKeys.item(vnId);
      const wasWaiting =
        queryClient.getQueryData<IVndbReviewItemResponse>(queryKey)?.item
          ?.state === "waiting";

      queryClient.setQueryData<IVndbReviewItemResponse>(queryKey, (response) =>
        response?.item
          ? { item: { ...response.item, state, decidedBy } }
          : response
      );
      refreshOverview();

      if (wasWaiting && vnId === openVnIdRef.current) {
        toast.error({
          title: "Already decided",
          description: `${decidedBy ?? "Another admin"} decided ${vnId} while you were reviewing it`,
        });
      }
    };

    const onApplied = ({ vnIds }: IVndbCandidatesAppliedEvent) => {
      vnIds.forEach((vnId) =>
        queryClient.invalidateQueries({
          queryKey: vndbCandidateQueryKeys.item(vnId),
        })
      );
      refreshOverview();
    };

    const onReconnect = () =>
      queryClient.invalidateQueries({ queryKey: vndbCandidateQueryKeys.all });

    const onConnectError = (error: Error) => {
      if (error.message !== UNAUTHORIZED_SOCKET_ERROR || isRefreshTried) return;

      isRefreshTried = true;

      refreshAuth().then(() => {
        if (!isCancelled) socket?.connect();
      });
    };

    createVndbReviewSocket()
      .then((reviewSocket) => {
        if (isCancelled) return;

        socket = reviewSocket;
        reviewSocket.on(VndbReviewSocketEvent.CANDIDATE_DECIDED, onDecided);
        reviewSocket.on(VndbReviewSocketEvent.CANDIDATES_APPLIED, onApplied);
        reviewSocket.on("connect_error", onConnectError);
        reviewSocket.io.on("reconnect", onReconnect);
        reviewSocket.connect();
      })
      .catch(() => undefined);

    return () => {
      isCancelled = true;
      socket?.io.off("reconnect", onReconnect);
      socket?.disconnect();
    };
  }, [queryClient]);
};
