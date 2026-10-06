import { io, type Socket } from "socket.io-client";
import {
  ACTIVITY_SOCKET_NAMESPACE,
  ActivitySocketEvent,
  type IActivityClientEvents,
  type IActivityServerEvents,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";

export type IActivitySocket = Socket<
  IActivityServerEvents,
  IActivityClientEvents
>;

let activitySocket: IActivitySocket | undefined;

const followers = new Map<string, number>();

export const getActivitySocket = () => {
  if (activitySocket) return activitySocket;

  const socket: IActivitySocket = io(`${API_URL}${ACTIVITY_SOCKET_NAMESPACE}`, {
    autoConnect: false,
  });

  socket.on("connect", () => {
    followers.forEach((_count, userId) =>
      socket.emit(ActivitySocketEvent.FOLLOW, { userId })
    );
  });

  activitySocket = socket;

  return socket;
};

export const followActivity = (userId: string) => {
  const socket = getActivitySocket();
  const count = followers.get(userId) ?? 0;

  followers.set(userId, count + 1);

  if (!socket.active) {
    socket.connect();
  } else if (socket.connected && !count) {
    socket.emit(ActivitySocketEvent.FOLLOW, { userId });
  }

  return () => {
    const remaining = (followers.get(userId) ?? 1) - 1;

    if (remaining > 0) {
      followers.set(userId, remaining);
      return;
    }

    followers.delete(userId);

    if (!followers.size) {
      socket.disconnect();
      return;
    }

    socket.emit(ActivitySocketEvent.UNFOLLOW, { userId });
  };
};
