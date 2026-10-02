import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import {
  type OnGatewayConnection,
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Model } from "mongoose";
import type { Namespace, Socket } from "socket.io";
import {
  type INotificationNewEvent,
  type INotificationsClientEvents,
  type INotificationsServerEvents,
  NOTIFICATIONS_SOCKET_NAMESPACE,
  NotificationsSocketEvent,
} from "@mooncellar/schemas";
import { ACCESS_TOKEN } from "../../../shared/constants";
import { getCookie } from "../../../shared/utils/cookie.utils";
import { User } from "../../user/schemas/user.schema";

type INotificationsSocketData = { userId: string };

type INotificationsNamespace = Namespace<
  INotificationsClientEvents,
  INotificationsServerEvents,
  Record<string, never>,
  INotificationsSocketData
>;

type INotificationsSocket = Socket<
  INotificationsClientEvents,
  INotificationsServerEvents,
  Record<string, never>,
  INotificationsSocketData
>;

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

const getUserRoom = (userId: string) => `user:${userId}`;

@WebSocketGateway({ namespace: NOTIFICATIONS_SOCKET_NAMESPACE })
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection
{
  @WebSocketServer()
  private readonly server?: INotificationsNamespace;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private readonly usersModel: Model<User>
  ) {}

  afterInit(server: INotificationsNamespace) {
    server.use((socket, next) => {
      this.authenticate(socket).then(
        () => next(),
        () => next(new Error(UNAUTHORIZED_SOCKET_ERROR))
      );
    });
  }

  async handleConnection(socket: INotificationsSocket) {
    if (socket.data.userId) {
      await socket.join(getUserRoom(socket.data.userId));
    }
  }

  notificationCreated(userId: string, event: INotificationNewEvent) {
    this.server
      ?.to(getUserRoom(userId))
      .emit(NotificationsSocketEvent.NEW, event);
  }

  unreadCountChanged(userId: string, unreadCount: number) {
    this.server
      ?.to(getUserRoom(userId))
      .emit(NotificationsSocketEvent.COUNT, { unreadCount });
  }

  private async authenticate(socket: INotificationsSocket) {
    const token = getCookie(socket.handshake.headers.cookie, ACCESS_TOKEN);

    if (!token) throw new Error(UNAUTHORIZED_SOCKET_ERROR);

    const { id } = this.jwtService.verify<{ id: string }>(token, {
      secret: process.env.JWT_SECRET,
    });

    if (!(await this.usersModel.exists({ _id: id }))) {
      throw new Error(UNAUTHORIZED_SOCKET_ERROR);
    }

    socket.data.userId = String(id);
  }
}
