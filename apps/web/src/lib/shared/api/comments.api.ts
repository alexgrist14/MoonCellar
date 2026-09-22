import { API_URL } from "@/src/lib/shared/constants";
import {
  IComment,
  ICommentsResponse,
  ICreateCommentRequest,
  IGetCommentsRequest,
  IGetRepliesRequest,
  IGetReviewsRequest,
  IGetUserReviewsRequest,
  IReportResponse,
  IReviewsResponse,
  IUpdateCommentRequest,
  IUpdateCommentStatusRequest,
  IUserReviewsResponse,
  IVoteResponse,
  SOCKET_ID_HEADER,
} from "@mooncellar/schemas";
import { getSocketId } from "@/src/lib/shared/socket/socket-id";
import agent from "./agent.api";

const COMMENTS_API = `${API_URL}/comments`;

const withSocketId = () => {
  const socketId = getSocketId();

  return socketId ? { headers: { [SOCKET_ID_HEADER]: socketId } } : {};
};

const getReviews = (gameId: string, params: IGetReviewsRequest) => {
  return agent.get<IReviewsResponse>(`${API_URL}/games/${gameId}/reviews`, {
    params,
  });
};

const getUserReviews = (userId: string, params: IGetUserReviewsRequest) => {
  return agent.get<IUserReviewsResponse>(`${API_URL}/user/${userId}/reviews`, {
    params,
    paramsSerializer: { indexes: null },
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
  return agent.post<IComment>(COMMENTS_API, data, withSocketId());
};

const update = (commentId: string, data: IUpdateCommentRequest) => {
  return agent.patch<IComment>(
    `${COMMENTS_API}/${commentId}`,
    data,
    withSocketId()
  );
};

const remove = (commentId: string) => {
  return agent.delete<IComment>(`${COMMENTS_API}/${commentId}`, withSocketId());
};

const setLike = (commentId: string, isLiked: boolean) => {
  const url = `${COMMENTS_API}/${commentId}/like`;

  return isLiked
    ? agent.put<IVoteResponse>(url, undefined, withSocketId())
    : agent.delete<IVoteResponse>(url, withSocketId());
};

const report = (commentId: string) => {
  return agent.post<IReportResponse>(`${COMMENTS_API}/${commentId}/report`);
};

const updateStatus = (commentId: string, data: IUpdateCommentStatusRequest) => {
  return agent.patch<IComment>(
    `${COMMENTS_API}/${commentId}/status`,
    data,
    withSocketId()
  );
};

export const commentsAPI = {
  getReviews,
  getUserReviews,
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
