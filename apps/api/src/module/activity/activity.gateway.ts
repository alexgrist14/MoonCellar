import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";
import {
  ACTIVITY_ROOMS_LIMIT,
  ACTIVITY_SOCKET_NAMESPACE,
  ActivityRoomRequestSchema,
  ActivitySocketEvent,
  type IActivityClientEvents,
  type IActivityRoomResponse,
  type IActivityServerEvents,
} from "@mooncellar/schemas";

type IActivityNamespace = Namespace<
  IActivityClientEvents,
  IActivityServerEvents
>;

type IActivitySocket = Socket<IActivityClientEvents, IActivityServerEvents>;

export const getActivityRoom = (userId: string) => `activity:${userId}`;

@WebSocketGateway({ namespace: ACTIVITY_SOCKET_NAMESPACE })
export class ActivityGateway {
  @WebSocketServer()
  private readonly server?: IActivityNamespace;

  @SubscribeMessage(ActivitySocketEvent.FOLLOW)
  async follow(
    @ConnectedSocket() socket: IActivitySocket,
    @MessageBody() payload: unknown
  ): Promise<IActivityRoomResponse> {
    const request = ActivityRoomRequestSchema.safeParse(payload);

    if (!request.success) return { ok: false, error: "Invalid user id" };

    const room = getActivityRoom(request.data.userId);

    if (!socket.rooms.has(room) && socket.rooms.size > ACTIVITY_ROOMS_LIMIT) {
      return { ok: false, error: "Too many feeds followed" };
    }

    await socket.join(room);

    return { ok: true };
  }

  @SubscribeMessage(ActivitySocketEvent.UNFOLLOW)
  async unfollow(
    @ConnectedSocket() socket: IActivitySocket,
    @MessageBody() payload: unknown
  ): Promise<IActivityRoomResponse> {
    const request = ActivityRoomRequestSchema.safeParse(payload);

    if (!request.success) return { ok: false, error: "Invalid user id" };

    await socket.leave(getActivityRoom(request.data.userId));

    return { ok: true };
  }

  changed(userId: string) {
    this.server
      ?.to(getActivityRoom(userId))
      .emit(ActivitySocketEvent.CHANGED, { userId });
  }
}
