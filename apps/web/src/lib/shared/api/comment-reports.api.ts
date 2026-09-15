import {
  ICommentReportAction,
  ICommentReportsResponse,
  IGetCommentReportsRequest,
  IResolveCommentReportsResponse,
} from "@mooncellar/schemas";
import { API_URL } from "../constants";
import agent from "./agent.api";

const COMMENT_REPORTS_URL = `${API_URL}/admin/comment-reports`;

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
  getReports,
  resolve,
};
