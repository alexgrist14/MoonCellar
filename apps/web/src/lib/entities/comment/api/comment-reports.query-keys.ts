import { ICommentReportStatus, ICommentStatus } from "@mooncellar/schemas";

export const commentReportQueryKeys = {
  all: ["comment-reports"] as const,
  list: (status: ICommentReportStatus, page: number) =>
    [...commentReportQueryKeys.all, status, page] as const,
  comments: (status: ICommentStatus | undefined, page: number) =>
    [...commentReportQueryKeys.all, "comments", status ?? "all", page] as const,
};
