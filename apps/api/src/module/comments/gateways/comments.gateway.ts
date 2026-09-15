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
  type ICommentCreatedEvent,
  type ICommentLikesEvent,
  type ICommentsClientEvents,
  type ICommentsServerEvents,
  type ICommentStatusEvent,
  type ICommentUpdatedEvent,
  type IDiscussionRoomResponse,
} from "@mooncellar/schemas";

type ICommentsNamespace = Namespace<
  ICommentsClientEvents,
  ICommentsServerEvents
>;

type ICommentsSocket = Socket<ICommentsClientEvents, ICommentsServerEvents>;

export const getDiscussionRoom = (gameId: string) => `discussion:${gameId}`;

@WebSocketGateway({ namespace: COMMENTS_SOCKET_NAMESPACE })
export class CommentsGateway {
  @WebSocketServer()
  private readonly server?: ICommentsNamespace;

  @SubscribeMessage(CommentsSocketEvent.JOIN_DISCUSSION)
  async join(
    @ConnectedSocket() socket: ICommentsSocket,
    @MessageBody() payload: unknown
  ): Promise<IDiscussionRoomResponse> {
    const request = DiscussionRoomRequestSchema.safeParse(payload);

    if (!request.success) return { ok: false, error: "Invalid game id" };

    const room = getDiscussionRoom(request.data.gameId);

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
    const request = DiscussionRoomRequestSchema.safeParse(payload);

    if (!request.success) return { ok: false, error: "Invalid game id" };

    await socket.leave(getDiscussionRoom(request.data.gameId));

    return { ok: true };
  }

  commentCreated(event: ICommentCreatedEvent, socketId?: string) {
    this.toDiscussion(event.gameId, socketId)?.emit(
      CommentsSocketEvent.COMMENT_CREATED,
      event
    );
  }

  commentUpdated(event: ICommentUpdatedEvent, socketId?: string) {
    this.toDiscussion(event.gameId, socketId)?.emit(
      CommentsSocketEvent.COMMENT_UPDATED,
      event
    );
  }

  commentStatusChanged(event: ICommentStatusEvent, socketId?: string) {
    this.toDiscussion(event.gameId, socketId)?.emit(
      CommentsSocketEvent.COMMENT_STATUS,
      event
    );
  }

  commentLikesChanged(event: ICommentLikesEvent, socketId?: string) {
    this.toDiscussion(event.gameId, socketId)?.emit(
      CommentsSocketEvent.COMMENT_LIKES,
      event
    );
  }

  private toDiscussion(gameId: string, socketId?: string) {
    const room = this.server?.to(getDiscussionRoom(gameId));

    return socketId ? room?.except(socketId) : room;
  }
}
