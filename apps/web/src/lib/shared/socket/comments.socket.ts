import { io, type Socket } from "socket.io-client";
import {
  COMMENTS_SOCKET_NAMESPACE,
  CommentsSocketEvent,
  type ICommentsClientEvents,
  type ICommentsServerEvents,
} from "@mooncellar/schemas";
import { API_URL } from "../constants";
import { setSocketId } from "./socket-id";

export type ICommentsSocket = Socket<
  ICommentsServerEvents,
  ICommentsClientEvents
>;

let commentsSocket: ICommentsSocket | undefined;

const followers = new Map<string, number>();

export const getCommentsSocket = () => {
  if (commentsSocket) return commentsSocket;

  const socket: ICommentsSocket = io(
    `${API_URL}${COMMENTS_SOCKET_NAMESPACE}`,
    { autoConnect: false }
  );

  socket.on("connect", () => {
    setSocketId(socket.id);
    followers.forEach((_count, gameId) =>
      socket.emit(CommentsSocketEvent.JOIN_DISCUSSION, { gameId })
    );
  });
  socket.on("disconnect", () => setSocketId(undefined));

  commentsSocket = socket;

  return socket;
};

export const followDiscussion = (gameId: string) => {
  const socket = getCommentsSocket();
  const count = followers.get(gameId) ?? 0;

  followers.set(gameId, count + 1);

  if (!socket.active) {
    socket.connect();
  } else if (socket.connected && !count) {
    socket.emit(CommentsSocketEvent.JOIN_DISCUSSION, { gameId });
  }

  return () => {
    const remaining = (followers.get(gameId) ?? 1) - 1;

    if (remaining > 0) {
      followers.set(gameId, remaining);
      return;
    }

    followers.delete(gameId);

    if (!followers.size) {
      socket.disconnect();
      return;
    }

    socket.emit(CommentsSocketEvent.LEAVE_DISCUSSION, { gameId });
  };
};
