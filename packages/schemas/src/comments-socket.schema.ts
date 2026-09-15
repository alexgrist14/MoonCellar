import { z } from "zod";
import { CommentStatusSchema } from "./comments.schema";
import { ObjectIdSchema } from "./utils";

export const COMMENTS_SOCKET_NAMESPACE = "/comments";
export const SOCKET_ID_HEADER = "x-socket-id";
export const DISCUSSION_ROOMS_LIMIT = 10;

export enum CommentsSocketEvent {
  JOIN_DISCUSSION = "discussion:join",
  LEAVE_DISCUSSION = "discussion:leave",
  COMMENT_CREATED = "comment:created",
  COMMENT_UPDATED = "comment:updated",
  COMMENT_STATUS = "comment:status",
  COMMENT_LIKES = "comment:likes",
}

export const DiscussionRoomRequestSchema = z.object({
  gameId: ObjectIdSchema.describe("Game whose discussion the socket follows"),
});

export const DiscussionRoomResponseSchema = z.object({
  ok: z.boolean().describe("Whether the socket joined or left the room"),
  error: z.string().optional().describe("Why the request was rejected"),
});

const CommentEventSchema = z.object({
  gameId: z.string().describe("Game id, the room the event was sent to"),
  commentId: z.string().describe("Comment id"),
});

export const CommentCreatedEventSchema = CommentEventSchema.extend({
  parentId: z
    .string()
    .nullable()
    .describe("Top-level comment of the thread, null for a top-level comment"),
  parentRepliesCount: z
    .number()
    .nullable()
    .describe("Visible replies of the parent after the change"),
});

export const CommentUpdatedEventSchema = CommentEventSchema.extend({
  body: z.string().describe("Sanitized rich text"),
  isSpoiler: z.boolean().describe("Comment contains spoilers"),
  updatedAt: z.string().describe("Last update date"),
});

export const CommentStatusEventSchema = CommentCreatedEventSchema.extend({
  status: CommentStatusSchema.describe("New moderation status"),
});

export const CommentLikesEventSchema = CommentEventSchema.extend({
  likesCount: z.number().describe("Likes after the change"),
});

export type IDiscussionRoomRequest = z.infer<
  typeof DiscussionRoomRequestSchema
>;
export type IDiscussionRoomResponse = z.infer<
  typeof DiscussionRoomResponseSchema
>;
export type ICommentCreatedEvent = z.infer<typeof CommentCreatedEventSchema>;
export type ICommentUpdatedEvent = z.infer<typeof CommentUpdatedEventSchema>;
export type ICommentStatusEvent = z.infer<typeof CommentStatusEventSchema>;
export type ICommentLikesEvent = z.infer<typeof CommentLikesEventSchema>;

export type ICommentsServerEvents = {
  [CommentsSocketEvent.COMMENT_CREATED]: (event: ICommentCreatedEvent) => void;
  [CommentsSocketEvent.COMMENT_UPDATED]: (event: ICommentUpdatedEvent) => void;
  [CommentsSocketEvent.COMMENT_STATUS]: (event: ICommentStatusEvent) => void;
  [CommentsSocketEvent.COMMENT_LIKES]: (event: ICommentLikesEvent) => void;
};

type IDiscussionRoomHandler = (
  request: IDiscussionRoomRequest,
  ack?: (response: IDiscussionRoomResponse) => void
) => void;

export type ICommentsClientEvents = {
  [CommentsSocketEvent.JOIN_DISCUSSION]: IDiscussionRoomHandler;
  [CommentsSocketEvent.LEAVE_DISCUSSION]: IDiscussionRoomHandler;
};
