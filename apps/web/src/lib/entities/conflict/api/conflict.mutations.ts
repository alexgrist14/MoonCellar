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

export const useAddConflictCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      source,
      externalId,
      gameId,
    }: Omit<IDecideConflictVariables, "choice"> & { gameId: string }) =>
      adminConflictsApi.addCandidate(source, externalId, { gameId }),
    onSettled: (_data, _error, { source, externalId }) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: conflictQueryKeys.item(source, externalId),
        }),
        queryClient.invalidateQueries({
          queryKey: conflictQueryKeys.listAll(),
        }),
      ]),
  });
};

const useRequeueConflictMutation = (
  request: typeof adminConflictsApi.reopen
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      source,
      externalId,
    }: Omit<IDecideConflictVariables, "choice">) =>
      request(source, externalId).then(({ data }) => data),
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

export const useReopenConflictMutation = () =>
  useRequeueConflictMutation(adminConflictsApi.reopen);

export const useUndoConflictMutation = () =>
  useRequeueConflictMutation(adminConflictsApi.undo);
