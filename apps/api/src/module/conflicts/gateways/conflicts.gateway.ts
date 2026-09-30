import { JwtService } from "@nestjs/jwt";
import { InjectModel } from "@nestjs/mongoose";
import {
  type OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Model } from "mongoose";
import type { Namespace, Socket } from "socket.io";
import {
  type IConflictDecidedEvent,
  type IConflictsAppliedEvent,
  type IConflictsClientEvents,
  type IConflictsServerEvents,
  RolesEnum,
  CONFLICTS_SOCKET_NAMESPACE,
  ConflictsSocketEvent,
} from "@mooncellar/schemas";
import { ACCESS_TOKEN } from "../../../shared/constants";
import { getCookie } from "../../../shared/utils/cookie.utils";
import { User } from "../../user/schemas/user.schema";

type IConflictsNamespace = Namespace<
  IConflictsClientEvents,
  IConflictsServerEvents
>;

type IConflictsSocket = Socket<IConflictsClientEvents, IConflictsServerEvents>;

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

@WebSocketGateway({ namespace: CONFLICTS_SOCKET_NAMESPACE })
export class ConflictsGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server?: IConflictsNamespace;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private readonly usersModel: Model<User>
  ) {}

  afterInit(server: IConflictsNamespace) {
    server.use((socket, next) => {
      this.authenticate(socket).then(
        () => next(),
        () => next(new Error(UNAUTHORIZED_SOCKET_ERROR))
      );
    });
  }

  conflictDecided(event: IConflictDecidedEvent) {
    this.server?.emit(ConflictsSocketEvent.CONFLICT_DECIDED, event);
  }

  conflictsApplied(event: IConflictsAppliedEvent) {
    this.server?.emit(ConflictsSocketEvent.CONFLICTS_APPLIED, event);
  }

  private async authenticate(socket: IConflictsSocket) {
    const token = getCookie(socket.handshake.headers.cookie, ACCESS_TOKEN);

    if (!token) throw new Error(UNAUTHORIZED_SOCKET_ERROR);

    const { id } = this.jwtService.verify<{ id: string }>(token, {
      secret: process.env.JWT_SECRET,
    });

    if (!(await this.usersModel.exists({ _id: id, roles: RolesEnum.ADMIN }))) {
      throw new Error(UNAUTHORIZED_SOCKET_ERROR);
    }
  }
}
