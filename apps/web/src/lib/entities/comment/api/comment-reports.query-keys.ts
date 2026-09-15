import { ICommentReportStatus } from "@mooncellar/schemas";

export const commentReportQueryKeys = {
  all: ["comment-reports"] as const,
  list: (status: ICommentReportStatus, page: number) =>
    [...commentReportQueryKeys.all, status, page] as const,
};
