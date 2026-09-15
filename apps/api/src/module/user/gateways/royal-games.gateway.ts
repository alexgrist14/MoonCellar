import { Logger } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import {
  ConnectedSocket,
  MessageBody,
  type OnGatewayConnection,
  type OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
} from "@nestjs/websockets";
import type { Namespace, Socket } from "socket.io";
import type { ZodError } from "zod";
import {
  AddRoyalGamesRequestSchema,
  type IRoyalClientEvents,
  type IRoyalGamesResponse,
  type IRoyalServerEvents,
  RemoveRoyalGamesRequestSchema,
  ROYAL_SOCKET_NAMESPACE,
  RoyalSocketEvent,
  SetRoyalGamesRequestSchema,
} from "@mooncellar/schemas";
import { ACCESS_TOKEN } from "../../../shared/constants";
import { getCookie } from "../../../shared/utils/cookie.utils";
import {
  type IRoyalGamesChange,
  UserRoyalGamesService,
} from "../services/user-royal-games.service";

type IRoyalSocketData = { userId: string };

type IRoyalNamespace = Namespace<
  IRoyalClientEvents,
  IRoyalServerEvents,
  Record<string, never>,
  IRoyalSocketData
>;

type IRoyalSocket = Socket<
  IRoyalClientEvents,
  IRoyalServerEvents,
  Record<string, never>,
  IRoyalSocketData
>;

export const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

export const getUserRoom = (userId: string) => `user:${userId}`;

const invalidRequest = (error: ZodError): IRoyalGamesResponse => ({
  ok: false,
  error: error.issues[0]?.message ?? "Invalid request",
});

@WebSocketGateway({ namespace: ROYAL_SOCKET_NAMESPACE })
export class RoyalGamesGateway implements OnGatewayInit, OnGatewayConnection {
  private readonly logger = new Logger(RoyalGamesGateway.name);

  constructor(
    private readonly royalGames: UserRoyalGamesService,
    private readonly jwtService: JwtService
  ) {}

  afterInit(server: IRoyalNamespace) {
    server.use((socket, next) => {
      this.authenticate(socket).then(
        () => next(),
        () => next(new Error(UNAUTHORIZED_SOCKET_ERROR))
      );
    });
  }

  async handleConnection(socket: IRoyalSocket) {
    if (socket.data.userId) {
      await socket.join(getUserRoom(socket.data.userId));
    }
  }

  @SubscribeMessage(RoyalSocketEvent.SYNC)
  async sync(
    @ConnectedSocket() socket: IRoyalSocket
  ): Promise<IRoyalGamesResponse> {
    try {
      return {
        ok: true,
        royalGames: await this.royalGames.getRoyalGames(socket.data.userId),
        rejected: [],
      };
    } catch (error) {
      this.logger.error(error, `Failed to load royal games: ${socket.data.userId}`);
      return { ok: false, error: "Could not load royal games" };
    }
  }

  @SubscribeMessage(RoyalSocketEvent.ADD)
  async add(
    @ConnectedSocket() socket: IRoyalSocket,
    @MessageBody() payload: unknown
  ): Promise<IRoyalGamesResponse> {
    const request = AddRoyalGamesRequestSchema.safeParse(payload);

    if (!request.success) return invalidRequest(request.error);

    return this.change(socket, (userId) =>
      this.royalGames.addRoyalGames(
        userId,
        request.data.gameIds,
        request.data.position
      )
    );
  }

  @SubscribeMessage(RoyalSocketEvent.REMOVE)
  async remove(
    @ConnectedSocket() socket: IRoyalSocket,
    @MessageBody() payload: unknown
  ): Promise<IRoyalGamesResponse> {
    const request = RemoveRoyalGamesRequestSchema.safeParse(payload);

    if (!request.success) return invalidRequest(request.error);

    return this.change(socket, (userId) =>
      this.royalGames.removeRoyalGames(userId, request.data.gameIds)
    );
  }

  @SubscribeMessage(RoyalSocketEvent.SET)
  async set(
    @ConnectedSocket() socket: IRoyalSocket,
    @MessageBody() payload: unknown
  ): Promise<IRoyalGamesResponse> {
    const request = SetRoyalGamesRequestSchema.safeParse(payload);

    if (!request.success) return invalidRequest(request.error);

    return this.change(socket, (userId) =>
      this.royalGames.setRoyalGames(userId, request.data.gameIds)
    );
  }

  private async authenticate(socket: IRoyalSocket) {
    const token = getCookie(socket.handshake.headers.cookie, ACCESS_TOKEN);

    if (!token) throw new Error(UNAUTHORIZED_SOCKET_ERROR);

    const { id } = this.jwtService.verify<{ id: string }>(token, {
      secret: process.env.JWT_SECRET,
    });

    if (!(await this.royalGames.hasUser(id))) {
      throw new Error(UNAUTHORIZED_SOCKET_ERROR);
    }

    socket.data.userId = String(id);
  }

  private async change(
    socket: IRoyalSocket,
    action: (userId: string) => Promise<IRoyalGamesChange>
  ): Promise<IRoyalGamesResponse> {
    const { userId } = socket.data;

    try {
      const change = await action(userId);

      socket
        .to(getUserRoom(userId))
        .emit(RoyalSocketEvent.CHANGED, { royalGames: change.royalGames });

      return { ok: true, ...change };
    } catch (error) {
      this.logger.error(error, `Failed to update royal games: ${userId}`);
      return { ok: false, error: "Could not update royal games" };
    }
  }
}
