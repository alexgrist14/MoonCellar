import { useQuery } from "@tanstack/react-query";
import { ICommentReportStatus } from "@mooncellar/schemas";
import { adminCommentReportsApi } from "@/src/lib/shared/api";
import { commentReportQueryKeys } from "./comment-reports.query-keys";

export const useCommentReportsQuery = (
  status: ICommentReportStatus,
  page: number
) =>
  useQuery({
    queryKey: commentReportQueryKeys.list(status, page),
    queryFn: () =>
      adminCommentReportsApi
        .getReports({ status, page })
        .then(({ data }) => data),
  });
