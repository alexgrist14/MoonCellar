import { type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import {
  RolesEnum,
  VNDB_REVIEW_SOCKET_NAMESPACE,
  VndbReviewSocketEvent,
} from "@mooncellar/schemas";
import { User } from "../../user/schemas/user.schema";
import { VndbReviewGateway } from "./vndb-review.gateway";

const SECRET = "vndb-review-spec";
const ADMIN_ID = "0123456789abcdef01234567";

const users = { exists: jest.fn() };

describe("VndbReviewGateway", () => {
  const jwt = new JwtService({});
  let app: INestApplication;
  let gateway: VndbReviewGateway;
  let url: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;

    const moduleRef = await Test.createTestingModule({
      providers: [
        VndbReviewGateway,
        { provide: JwtService, useValue: jwt },
        { provide: getModelToken(User.name), useValue: users },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0, "127.0.0.1");

    gateway = moduleRef.get(VndbReviewGateway);
    url = `${await app.getUrl()}${VNDB_REVIEW_SOCKET_NAMESPACE}`;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    users.exists.mockResolvedValue({ _id: ADMIN_ID });
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  afterAll(() => app.close());

  const sessionCookie = () =>
    `accessMoonToken=${jwt.sign({ id: ADMIN_ID }, { secret: SECRET })}`;

  const open = (cookie?: string) => {
    const socket = io(url, {
      transports: ["websocket"],
      forceNew: true,
      extraHeaders: cookie ? { cookie } : {},
    });

    sockets.push(socket);

    return new Promise<Socket>((resolve, reject) => {
      socket.once("connect", () => resolve(socket));
      socket.once("connect_error", reject);
    });
  };

  it("refuses a connection without a session cookie", async () => {
    await expect(open()).rejects.toThrow("Unauthorized");
  });

  it("refuses a signed-in user who is not an admin", async () => {
    users.exists.mockResolvedValue(null);

    await expect(open(sessionCookie())).rejects.toThrow("Unauthorized");
    expect(users.exists).toHaveBeenCalledWith({
      _id: ADMIN_ID,
      roles: RolesEnum.ADMIN,
    });
  });

  it("tells every connected admin about a decision", async () => {
    const admins = await Promise.all([
      open(sessionCookie()),
      open(sessionCookie()),
    ]);
    const event = {
      vnId: "v1",
      state: "queued-match" as const,
      decidedBy: "alex",
    };
    const received = Promise.all(
      admins.map(
        (socket) =>
          new Promise((resolve) =>
            socket.once(VndbReviewSocketEvent.CANDIDATE_DECIDED, resolve)
          )
      )
    );

    gateway.candidateDecided(event);

    await expect(received).resolves.toEqual([event, event]);
  });
});
