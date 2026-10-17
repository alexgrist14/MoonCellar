import { useMutation, useQueryClient } from "@tanstack/react-query";
import { gameAuthApi } from "@/src/lib/shared/api";
import { gameSessionQueryKeys } from "./game-session.query-keys";

export const useApproveGameDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (userCode: string) =>
      gameAuthApi.approve(userCode).then(({ data }) => data),
    onSuccess: (link) => {
      queryClient.setQueryData(gameSessionQueryKeys.link(link.userCode), link);
      queryClient.invalidateQueries({ queryKey: gameSessionQueryKeys.list() });
    },
  });
};

export const useRevokeGameSessionMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => gameAuthApi.revokeSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gameSessionQueryKeys.list() });
    },
  });
};
