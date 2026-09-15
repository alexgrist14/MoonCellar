import { API_URL } from "../constants";
import {
  IComment,
  ICommentsResponse,
  ICreateCommentRequest,
  IGetCommentsRequest,
  IGetRepliesRequest,
  IGetReviewsRequest,
  IReportResponse,
  IReviewsResponse,
  IUpdateCommentRequest,
  IUpdateCommentStatusRequest,
  IVoteResponse,
} from "@mooncellar/schemas";
import agent from "./agent.api";

const COMMENTS_API = `${API_URL}/comments`;

const getReviews = (gameId: string, params: IGetReviewsRequest) => {
  return agent.get<IReviewsResponse>(`${API_URL}/games/${gameId}/reviews`, {
    params,
  });
};

const setReviewHelpful = (reviewId: string, isHelpful: boolean) => {
  const url = `${API_URL}/reviews/${reviewId}/helpful`;

  return isHelpful
    ? agent.put<IVoteResponse>(url)
    : agent.delete<IVoteResponse>(url);
};

const getComments = (gameId: string, params: IGetCommentsRequest) => {
  return agent.get<ICommentsResponse>(`${API_URL}/games/${gameId}/comments`, {
    params,
  });
};

const getReplies = (commentId: string, params: IGetRepliesRequest) => {
  return agent.get<ICommentsResponse>(`${COMMENTS_API}/${commentId}/replies`, {
    params,
  });
};

const create = (data: ICreateCommentRequest) => {
  return agent.post<IComment>(COMMENTS_API, data);
};

const update = (commentId: string, data: IUpdateCommentRequest) => {
  return agent.patch<IComment>(`${COMMENTS_API}/${commentId}`, data);
};

const remove = (commentId: string) => {
  return agent.delete<IComment>(`${COMMENTS_API}/${commentId}`);
};

const setLike = (commentId: string, isLiked: boolean) => {
  const url = `${COMMENTS_API}/${commentId}/like`;

  return isLiked
    ? agent.put<IVoteResponse>(url)
    : agent.delete<IVoteResponse>(url);
};

const report = (commentId: string) => {
  return agent.post<IReportResponse>(`${COMMENTS_API}/${commentId}/report`);
};

const updateStatus = (commentId: string, data: IUpdateCommentStatusRequest) => {
  return agent.patch<IComment>(`${COMMENTS_API}/${commentId}/status`, data);
};

export const commentsAPI = {
  getReviews,
  setReviewHelpful,
  getComments,
  getReplies,
  create,
  update,
  remove,
  setLike,
  report,
  updateStatus,
};
