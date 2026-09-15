import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ICommentReportAction } from "@mooncellar/schemas";
import { adminCommentReportsApi } from "@/src/lib/shared/api";
import { commentQueryKeys } from "./comment.query-keys";
import { commentReportQueryKeys } from "./comment-reports.query-keys";

export const useResolveCommentReportMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      commentId,
      action,
    }: {
      commentId: string;
      action: ICommentReportAction;
    }) =>
      adminCommentReportsApi
        .resolve(commentId, action)
        .then(({ data }) => data),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: commentReportQueryKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: commentQueryKeys.all }),
      ]),
  });
};
