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
  type IVndbCandidateDecidedEvent,
  type IVndbCandidatesAppliedEvent,
  type IVndbReviewClientEvents,
  type IVndbReviewServerEvents,
  RolesEnum,
  VNDB_REVIEW_SOCKET_NAMESPACE,
  VndbReviewSocketEvent,
} from "@mooncellar/schemas";
import { ACCESS_TOKEN } from "../../../shared/constants";
import { getCookie } from "../../../shared/utils/cookie.utils";
import { User } from "../../user/schemas/user.schema";

type IVndbReviewNamespace = Namespace<
  IVndbReviewClientEvents,
  IVndbReviewServerEvents
>;

type IVndbReviewSocket = Socket<
  IVndbReviewClientEvents,
  IVndbReviewServerEvents
>;

const UNAUTHORIZED_SOCKET_ERROR = "Unauthorized";

@WebSocketGateway({ namespace: VNDB_REVIEW_SOCKET_NAMESPACE })
export class VndbReviewGateway implements OnGatewayInit {
  @WebSocketServer()
  private readonly server?: IVndbReviewNamespace;

  constructor(
    private readonly jwtService: JwtService,
    @InjectModel(User.name)
    private readonly usersModel: Model<User>
  ) {}

  afterInit(server: IVndbReviewNamespace) {
    server.use((socket, next) => {
      this.authenticate(socket).then(
        () => next(),
        () => next(new Error(UNAUTHORIZED_SOCKET_ERROR))
      );
    });
  }

  candidateDecided(event: IVndbCandidateDecidedEvent) {
    this.server?.emit(VndbReviewSocketEvent.CANDIDATE_DECIDED, event);
  }

  candidatesApplied(event: IVndbCandidatesAppliedEvent) {
    this.server?.emit(VndbReviewSocketEvent.CANDIDATES_APPLIED, event);
  }

  private async authenticate(socket: IVndbReviewSocket) {
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
