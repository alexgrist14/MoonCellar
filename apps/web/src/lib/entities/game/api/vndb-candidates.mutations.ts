import { useMutation, useQueryClient } from "@tanstack/react-query";
import { adminVndbCandidatesApi } from "@/src/lib/shared/api";
import { vndbCandidateQueryKeys } from "./vndb-candidates.query-keys";

export const useDecideVndbCandidateMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ vnId, gameId }: { vnId: string; gameId: string | null }) =>
      adminVndbCandidatesApi.decide(vnId, gameId).then(({ data }) => data),
    onSuccess: (summary) =>
      queryClient.setQueryData(vndbCandidateQueryKeys.summary(), summary),
  });
};
