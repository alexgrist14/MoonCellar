import { io, type Socket } from "socket.io-client";
import {
  COMMENTS_SOCKET_NAMESPACE,
  CommentsSocketEvent,
  getCommentTargetFields,
  getCommentTargetKey,
  type ICommentsClientEvents,
  type ICommentsServerEvents,
  type ICommentTarget,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";
import { setSocketId } from "./socket-id";

export type ICommentsSocket = Socket<
  ICommentsServerEvents,
  ICommentsClientEvents
>;

let commentsSocket: ICommentsSocket | undefined;

const followers = new Map<string, { target: ICommentTarget; count: number }>();

export const getCommentsSocket = () => {
  if (commentsSocket) return commentsSocket;

  const socket: ICommentsSocket = io(`${API_URL}${COMMENTS_SOCKET_NAMESPACE}`, {
    autoConnect: false,
  });

  socket.on("connect", () => {
    setSocketId(socket.id);
    followers.forEach(({ target }) =>
      socket.emit(
        CommentsSocketEvent.JOIN_DISCUSSION,
        getCommentTargetFields(target)
      )
    );
  });
  socket.on("disconnect", () => setSocketId(undefined));

  commentsSocket = socket;

  return socket;
};

export const followDiscussion = (target: ICommentTarget) => {
  const socket = getCommentsSocket();
  const key = getCommentTargetKey(target);
  const count = followers.get(key)?.count ?? 0;

  followers.set(key, { target, count: count + 1 });

  if (!socket.active) {
    socket.connect();
  } else if (socket.connected && !count) {
    socket.emit(
      CommentsSocketEvent.JOIN_DISCUSSION,
      getCommentTargetFields(target)
    );
  }

  return () => {
    const remaining = (followers.get(key)?.count ?? 1) - 1;

    if (remaining > 0) {
      followers.set(key, { target, count: remaining });
      return;
    }

    followers.delete(key);

    if (!followers.size) {
      socket.disconnect();
      return;
    }

    socket.emit(
      CommentsSocketEvent.LEAVE_DISCUSSION,
      getCommentTargetFields(target)
    );
  };
};
