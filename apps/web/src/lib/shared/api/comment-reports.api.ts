import {
  IAdminCommentsResponse,
  ICommentReportAction,
  ICommentReportsResponse,
  IGetAdminCommentsRequest,
  IGetCommentReportsRequest,
  IResolveCommentReportsResponse,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import agent from "./agent.api";

const COMMENT_REPORTS_URL = `${API_URL}/admin/comment-reports`;
const ADMIN_COMMENTS_URL = `${API_URL}/admin/comments`;

const getComments = (params: IGetAdminCommentsRequest) => {
  return agent.get<IAdminCommentsResponse>(ADMIN_COMMENTS_URL, { params });
};

const getReports = (params: IGetCommentReportsRequest) => {
  return agent.get<ICommentReportsResponse>(COMMENT_REPORTS_URL, { params });
};

const resolve = (commentId: string, action: ICommentReportAction) => {
  return agent.post<IResolveCommentReportsResponse>(
    `${COMMENT_REPORTS_URL}/${commentId}/resolve`,
    { action }
  );
};

export const adminCommentReportsApi = {
  getComments,
  getReports,
  resolve,
};
