import { useQuery } from "@tanstack/react-query";
import { ICommentReportStatus, ICommentStatus } from "@mooncellar/schemas";
import { adminCommentReportsApi } from "@/src/lib/shared/api";
import { commentReportQueryKeys } from "./comment-reports.query-keys";

export const useCommentReportsQuery = (
  status: ICommentReportStatus,
  page: number,
  enabled = true
) =>
  useQuery({
    enabled,
    queryKey: commentReportQueryKeys.list(status, page),
    queryFn: () =>
      adminCommentReportsApi
        .getReports({ status, page })
        .then(({ data }) => data),
  });

export const useAdminCommentsQuery = (
  status: ICommentStatus | undefined,
  page: number
) =>
  useQuery({
    queryKey: commentReportQueryKeys.comments(status, page),
    queryFn: () =>
      adminCommentReportsApi
        .getComments({ status, page })
        .then(({ data }) => data),
  });
