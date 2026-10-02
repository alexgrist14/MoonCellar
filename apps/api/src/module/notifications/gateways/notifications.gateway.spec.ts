import { type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { getModelToken } from "@nestjs/mongoose";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import {
  NOTIFICATIONS_SOCKET_NAMESPACE,
  NotificationsSocketEvent,
} from "@mooncellar/schemas";
import { User } from "../../user/schemas/user.schema";
import { NotificationsGateway } from "./notifications.gateway";

const SECRET = "notifications-spec";
const ALICE_ID = "0123456789abcdef01234567";
const BOB_ID = "76543210fedcba9876543210";

const users = { exists: jest.fn() };

describe("NotificationsGateway", () => {
  const jwt = new JwtService({});
  let app: INestApplication;
  let gateway: NotificationsGateway;
  let url: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;

    const moduleRef = await Test.createTestingModule({
      providers: [
        NotificationsGateway,
        { provide: JwtService, useValue: jwt },
        { provide: getModelToken(User.name), useValue: users },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0, "127.0.0.1");

    gateway = moduleRef.get(NotificationsGateway);
    url = `${await app.getUrl()}${NOTIFICATIONS_SOCKET_NAMESPACE}`;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    users.exists.mockResolvedValue({ _id: ALICE_ID });
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  afterAll(() => app.close());

  const sessionCookie = (id: string) =>
    `accessMoonToken=${jwt.sign({ id }, { secret: SECRET })}`;

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

  it("refuses a session of a deleted user", async () => {
    users.exists.mockResolvedValue(null);

    await expect(open(sessionCookie(ALICE_ID))).rejects.toThrow("Unauthorized");
  });

  it("sends a user's count to every socket of that user and nobody else", async () => {
    const [aliceTab, aliceDevice, bob] = await Promise.all([
      open(sessionCookie(ALICE_ID)),
      open(sessionCookie(ALICE_ID)),
      open(sessionCookie(BOB_ID)),
    ]);
    const bobReceived = jest.fn();

    bob.on(NotificationsSocketEvent.COUNT, bobReceived);

    const received = Promise.all(
      [aliceTab, aliceDevice].map(
        (socket) =>
          new Promise((resolve) =>
            socket.once(NotificationsSocketEvent.COUNT, resolve)
          )
      )
    );

    gateway.unreadCountChanged(ALICE_ID, 3);

    await expect(received).resolves.toEqual([
      { unreadCount: 3 },
      { unreadCount: 3 },
    ]);
    expect(bobReceived).not.toHaveBeenCalled();
  });
});
