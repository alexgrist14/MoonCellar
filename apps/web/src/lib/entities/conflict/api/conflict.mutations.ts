import { useMutation, useQueryClient } from "@tanstack/react-query";
import { IConflictSource, IDecideConflictRequest } from "@mooncellar/schemas";
import { adminConflictsApi } from "@/src/lib/shared/api";
import { conflictQueryKeys } from "./conflict.query-keys";

interface IDecideConflictVariables {
  source: IConflictSource;
  externalId: string;
  choice: IDecideConflictRequest;
}

export const useDecideConflictMutation = () => {
  const queryClient = useQueryClient();

  const invalidate = (source: IConflictSource, externalId: string) =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.item(source, externalId),
      }),
      queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.summaryAll(),
      }),
      queryClient.invalidateQueries({ queryKey: conflictQueryKeys.listAll() }),
    ]);

  return useMutation({
    mutationFn: ({ source, externalId, choice }: IDecideConflictVariables) =>
      adminConflictsApi
        .decide(source, externalId, choice)
        .then(({ data }) => data),
    onSuccess: (summary, { source, externalId }) => {
      queryClient.setQueryData(conflictQueryKeys.summary(source), summary);

      invalidate(source, externalId);
    },
    onError: (_error, { source, externalId }) => invalidate(source, externalId),
  });
};

export const useReopenConflictMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      source,
      externalId,
    }: Omit<IDecideConflictVariables, "choice">) =>
      adminConflictsApi.reopen(source, externalId).then(({ data }) => data),
    onSuccess: (summary, { source, externalId }) => {
      queryClient.setQueryData(conflictQueryKeys.summary(source), summary);
      queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.item(source, externalId),
      });
      queryClient.invalidateQueries({
        queryKey: conflictQueryKeys.summaryAll(),
      });
      queryClient.invalidateQueries({ queryKey: conflictQueryKeys.listAll() });
    },
  });
};
