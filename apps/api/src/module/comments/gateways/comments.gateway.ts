import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";
import {
  COMMENTS_SOCKET_NAMESPACE,
  CommentsSocketEvent,
  DISCUSSION_ROOMS_LIMIT,
  DiscussionRoomRequestSchema,
  getCommentTarget,
  getCommentTargetKey,
  type ICommentCreatedEvent,
  type ICommentLikesEvent,
  type ICommentsClientEvents,
  type ICommentsServerEvents,
  type ICommentStatusEvent,
  type ICommentTarget,
  type ICommentTargetFields,
  type ICommentUpdatedEvent,
  type IDiscussionRoomResponse,
} from "@mooncellar/schemas";

type ICommentsNamespace = Namespace<
  ICommentsClientEvents,
  ICommentsServerEvents
>;

type ICommentsSocket = Socket<ICommentsClientEvents, ICommentsServerEvents>;

const INVALID_DISCUSSION = "Invalid game or post id";

export const getDiscussionRoom = (target: ICommentTarget) =>
  `discussion:${getCommentTargetKey(target)}`;

@WebSocketGateway({ namespace: COMMENTS_SOCKET_NAMESPACE })
export class CommentsGateway {
  @WebSocketServer()
  private readonly server?: ICommentsNamespace;

  @SubscribeMessage(CommentsSocketEvent.JOIN_DISCUSSION)
  async join(
    @ConnectedSocket() socket: ICommentsSocket,
    @MessageBody() payload: unknown
  ): Promise<IDiscussionRoomResponse> {
    const target = this.parseTarget(payload);

    if (!target) return { ok: false, error: INVALID_DISCUSSION };

    const room = getDiscussionRoom(target);

    if (!socket.rooms.has(room) && socket.rooms.size > DISCUSSION_ROOMS_LIMIT) {
      return { ok: false, error: "Too many discussions followed" };
    }

    await socket.join(room);

    return { ok: true };
  }

  @SubscribeMessage(CommentsSocketEvent.LEAVE_DISCUSSION)
  async leave(
    @ConnectedSocket() socket: ICommentsSocket,
    @MessageBody() payload: unknown
  ): Promise<IDiscussionRoomResponse> {
    const target = this.parseTarget(payload);

    if (!target) return { ok: false, error: INVALID_DISCUSSION };

    await socket.leave(getDiscussionRoom(target));

    return { ok: true };
  }

  commentCreated(event: ICommentCreatedEvent, socketId?: string) {
    this.toDiscussion(event, socketId)?.emit(
      CommentsSocketEvent.COMMENT_CREATED,
      event
    );
  }

  commentUpdated(event: ICommentUpdatedEvent, socketId?: string) {
    this.toDiscussion(event, socketId)?.emit(
      CommentsSocketEvent.COMMENT_UPDATED,
      event
    );
  }

  commentStatusChanged(event: ICommentStatusEvent, socketId?: string) {
    this.toDiscussion(event, socketId)?.emit(
      CommentsSocketEvent.COMMENT_STATUS,
      event
    );
  }

  commentLikesChanged(event: ICommentLikesEvent, socketId?: string) {
    this.toDiscussion(event, socketId)?.emit(
      CommentsSocketEvent.COMMENT_LIKES,
      event
    );
  }

  private parseTarget(payload: unknown) {
    const request = DiscussionRoomRequestSchema.safeParse(payload);

    return request.success ? getCommentTarget(request.data) : null;
  }

  private toDiscussion(event: ICommentTargetFields, socketId?: string) {
    const target = getCommentTarget(event);

    if (!target) return undefined;

    const room = this.server?.to(getDiscussionRoom(target));

    return socketId ? room?.except(socketId) : room;
  }
}
