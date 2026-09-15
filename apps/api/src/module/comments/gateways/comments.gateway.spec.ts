import { type INestApplication } from "@nestjs/common";
import { IoAdapter } from "@nestjs/platform-socket.io";
import { Test } from "@nestjs/testing";
import { io, type Socket } from "socket.io-client";
import {
  COMMENTS_SOCKET_NAMESPACE,
  CommentsSocketEvent,
  DISCUSSION_ROOMS_LIMIT,
  type IDiscussionRoomResponse,
} from "@mooncellar/schemas";
import { CommentsGateway } from "./comments.gateway";

const GAME_ID = "0123456789abcdef01234567";
const OTHER_GAME_ID = "fedcba9876543210fedcba98";
const SILENCE_MS = 200;

const createdEvent = {
  gameId: GAME_ID,
  commentId: "comment-id",
  parentId: null,
  parentRepliesCount: null,
};

describe("CommentsGateway", () => {
  let app: INestApplication;
  let gateway: CommentsGateway;
  let url: string;
  const sockets: Socket[] = [];

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [CommentsGateway],
    }).compile();

    app = moduleRef.createNestApplication({ logger: false });
    app.useWebSocketAdapter(new IoAdapter(app));
    await app.listen(0, "127.0.0.1");

    gateway = app.get(CommentsGateway);
    url = `${await app.getUrl()}${COMMENTS_SOCKET_NAMESPACE}`;
  });

  afterEach(() => {
    sockets.splice(0).forEach((socket) => socket.disconnect());
  });

  afterAll(() => app.close());

  const connect = async () => {
    const socket = io(url, { transports: ["websocket"], forceNew: true });

    sockets.push(socket);

    await new Promise<void>((resolve, reject) => {
      socket.once("connect", resolve);
      socket.once("connect_error", reject);
    });

    return socket;
  };

  const follow = (
    socket: Socket,
    gameId: string,
    event: CommentsSocketEvent = CommentsSocketEvent.JOIN_DISCUSSION
  ): Promise<IDiscussionRoomResponse> => socket.emitWithAck(event, { gameId });

  const nextEvent = (socket: Socket, event: CommentsSocketEvent) =>
    new Promise((resolve) => socket.once(event, resolve));

  const isSilent = (socket: Socket, event: CommentsSocketEvent) =>
    new Promise<boolean>((resolve) => {
      const onEvent = () => resolve(false);

      socket.once(event, onEvent);
      setTimeout(() => {
        socket.off(event, onEvent);
        resolve(true);
      }, SILENCE_MS);
    });

  it("delivers events to sockets following the game", async () => {
    const socket = await connect();

    await expect(follow(socket, GAME_ID)).resolves.toEqual({ ok: true });

    const received = nextEvent(socket, CommentsSocketEvent.COMMENT_CREATED);
    gateway.commentCreated(createdEvent);

    await expect(received).resolves.toEqual(createdEvent);
  });

  it("keeps events inside their game", async () => {
    const socket = await connect();
    await follow(socket, OTHER_GAME_ID);

    const silent = isSilent(socket, CommentsSocketEvent.COMMENT_CREATED);
    gateway.commentCreated(createdEvent);

    await expect(silent).resolves.toBe(true);
  });

  it("skips the socket that made the change", async () => {
    const [author, reader] = await Promise.all([connect(), connect()]);
    await Promise.all([follow(author, GAME_ID), follow(reader, GAME_ID)]);

    const event = { gameId: GAME_ID, commentId: "comment-id", likesCount: 3 };
    const authorSilent = isSilent(author, CommentsSocketEvent.COMMENT_LIKES);
    const readerReceived = nextEvent(reader, CommentsSocketEvent.COMMENT_LIKES);

    gateway.commentLikesChanged(event, author.id);

    await expect(readerReceived).resolves.toEqual(event);
    await expect(authorSilent).resolves.toBe(true);
  });

  it("stops delivering after the socket leaves", async () => {
    const socket = await connect();
    await follow(socket, GAME_ID);

    await expect(
      follow(socket, GAME_ID, CommentsSocketEvent.LEAVE_DISCUSSION)
    ).resolves.toEqual({ ok: true });

    const silent = isSilent(socket, CommentsSocketEvent.COMMENT_CREATED);
    gateway.commentCreated(createdEvent);

    await expect(silent).resolves.toBe(true);
  });

  it("rejects a malformed game id", async () => {
    const socket = await connect();

    await expect(follow(socket, "not-a-game")).resolves.toEqual({
      ok: false,
      error: "Invalid game id",
    });
  });

  it("caps the discussions one socket can follow", async () => {
    const socket = await connect();
    const gameIds = Array.from({ length: DISCUSSION_ROOMS_LIMIT + 1 }, (_, i) =>
      i.toString(16).padStart(24, "0")
    );
    const responses: IDiscussionRoomResponse[] = [];

    for (const gameId of gameIds) {
      responses.push(await follow(socket, gameId));
    }

    expect(responses.slice(0, DISCUSSION_ROOMS_LIMIT)).toEqual(
      Array(DISCUSSION_ROOMS_LIMIT).fill({ ok: true })
    );
    expect(responses[DISCUSSION_ROOMS_LIMIT]).toEqual({
      ok: false,
      error: "Too many discussions followed",
    });
    await expect(follow(socket, gameIds[0])).resolves.toEqual({ ok: true });
  });

  it("ignores emits before a server is attached", () => {
    expect(() =>
      new CommentsGateway().commentCreated(createdEvent)
    ).not.toThrow();
  });
});
