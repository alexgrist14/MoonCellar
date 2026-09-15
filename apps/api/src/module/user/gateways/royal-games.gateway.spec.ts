import { type INestApplication } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import { ROYAL_SOCKET_NAMESPACE, RoyalSocketEvent } from "@mooncellar/schemas";
import { UserRoyalGamesService } from "../services/user-royal-games.service";
import { RoyalGamesGateway } from "./royal-games.gateway";

const SECRET = "royal-games-spec";
const USER_ID = "0123456789abcdef01234567";
const OTHER_USER_ID = "fedcba9876543210fedcba98";
const GAME_ID = "aaaaaaaaaaaaaaaaaaaaaaaa";
const SILENCE_MS = 200;

const service = {
  hasUser: jest.fn(),
  getRoyalGames: jest.fn(),
  addRoyalGames: jest.fn(),
  removeRoyalGames: jest.fn(),
  setRoyalGames: jest.fn(),
};

describe("RoyalGamesGateway", () => {
  const jwt = new JwtService({});
  let app: INestApplication;
  let url: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    process.env.JWT_SECRET = SECRET;

    const moduleRef = await Test.createTestingModule({
      providers: [
        RoyalGamesGateway,
        { provide: UserRoyalGamesService, useValue: service },
        { provide: JwtService, useValue: jwt },
      ],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0, "127.0.0.1");

    url = `${await app.getUrl()}${ROYAL_SOCKET_NAMESPACE}`;
  });

  beforeEach(() => {
    jest.resetAllMocks();
    service.hasUser.mockResolvedValue(true);
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  afterAll(() => app.close());

  const sessionCookie = (userId: string, secret = SECRET) =>
    `accessMoonToken=${jwt.sign({ id: userId }, { secret })}`;

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

  const nextEvent = (socket: Socket, event: RoyalSocketEvent) =>
    new Promise((resolve) => socket.once(event, resolve));

  const isSilent = (socket: Socket, event: RoyalSocketEvent) =>
    new Promise<boolean>((resolve) => {
      const onEvent = () => resolve(false);

      socket.once(event, onEvent);
      setTimeout(() => {
        socket.off(event, onEvent);
        resolve(true);
      }, SILENCE_MS);
    });

  it("refuses a connection without a session cookie", async () => {
    await expect(open()).rejects.toThrow("Unauthorized");
  });

  it("refuses a token signed with another secret", async () => {
    await expect(
      open(sessionCookie(USER_ID, "another-secret"))
    ).rejects.toThrow("Unauthorized");
  });

  it("refuses a token whose user no longer exists", async () => {
    service.hasUser.mockResolvedValue(false);

    await expect(open(sessionCookie(USER_ID))).rejects.toThrow("Unauthorized");
  });

  it("returns the stored list on sync", async () => {
    service.getRoyalGames.mockResolvedValue([GAME_ID]);
    const socket = await open(sessionCookie(USER_ID));

    await expect(
      socket.emitWithAck(RoyalSocketEvent.SYNC, {})
    ).resolves.toEqual({ ok: true, royalGames: [GAME_ID], rejected: [] });
    expect(service.getRoyalGames).toHaveBeenCalledWith(USER_ID);
  });

  it("pushes a change to the other sockets of the same user only", async () => {
    service.addRoyalGames.mockResolvedValue({
      royalGames: [GAME_ID],
      rejected: [],
    });
    const [author, otherTab, stranger] = await Promise.all([
      open(sessionCookie(USER_ID)),
      open(sessionCookie(USER_ID)),
      open(sessionCookie(OTHER_USER_ID)),
    ]);

    const otherTabReceived = nextEvent(otherTab, RoyalSocketEvent.CHANGED);
    const authorSilent = isSilent(author, RoyalSocketEvent.CHANGED);
    const strangerSilent = isSilent(stranger, RoyalSocketEvent.CHANGED);

    await expect(
      author.emitWithAck(RoyalSocketEvent.ADD, {
        gameIds: [GAME_ID],
        position: "start",
      })
    ).resolves.toEqual({ ok: true, royalGames: [GAME_ID], rejected: [] });

    expect(service.addRoyalGames).toHaveBeenCalledWith(
      USER_ID,
      [GAME_ID],
      "start"
    );
    await expect(otherTabReceived).resolves.toEqual({ royalGames: [GAME_ID] });
    await expect(authorSilent).resolves.toBe(true);
    await expect(strangerSilent).resolves.toBe(true);
  });

  it("removes and replaces games for the signed-in user", async () => {
    service.removeRoyalGames.mockResolvedValue({ royalGames: [], rejected: [] });
    service.setRoyalGames.mockResolvedValue({
      royalGames: [GAME_ID],
      rejected: [],
    });
    const socket = await open(sessionCookie(USER_ID));

    await socket.emitWithAck(RoyalSocketEvent.REMOVE, { gameIds: [GAME_ID] });
    await socket.emitWithAck(RoyalSocketEvent.SET, { gameIds: [GAME_ID] });

    expect(service.removeRoyalGames).toHaveBeenCalledWith(USER_ID, [GAME_ID]);
    expect(service.setRoyalGames).toHaveBeenCalledWith(USER_ID, [GAME_ID]);
  });

  it("rejects a malformed request without touching the list", async () => {
    const socket = await open(sessionCookie(USER_ID));

    await expect(
      socket.emitWithAck(RoyalSocketEvent.ADD, { gameIds: ["not-a-game"] })
    ).resolves.toEqual({ ok: false, error: "Invalid id" });
    expect(service.addRoyalGames).not.toHaveBeenCalled();
  });

  it("answers a failed update instead of leaving the ack pending", async () => {
    service.addRoyalGames.mockRejectedValue(new Error("connection lost"));
    const socket = await open(sessionCookie(USER_ID));

    await expect(
      socket.emitWithAck(RoyalSocketEvent.ADD, { gameIds: [GAME_ID] })
    ).resolves.toEqual({ ok: false, error: "Could not update royal games" });
  });
});
