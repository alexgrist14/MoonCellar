import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ICreateContentRequest,
  IDecideContentRequest,
} from "@mooncellar/schemas";
import { contentRequestsApi } from "@/src/lib/shared/api";
import { requestQueryKeys } from "./request.query-keys";

export const useCreateRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: ICreateContentRequest) =>
      contentRequestsApi.create(body).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.mine() });
    },
  });
};

export const useWithdrawRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => contentRequestsApi.withdraw(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.mine() });
    },
  });
};

export const useDecideRequestMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: IDecideContentRequest }) =>
      contentRequestsApi.decide(id, body).then(({ data }) => data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: requestQueryKeys.all });
    },
  });
};
