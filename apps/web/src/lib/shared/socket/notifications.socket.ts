import type { Socket } from "socket.io-client";
import {
  INotificationsClientEvents,
  INotificationsServerEvents,
  NOTIFICATIONS_SOCKET_NAMESPACE,
} from "@mooncellar/schemas";
import { getAccountManager } from "./account.socket";

export type INotificationsSocket = Socket<
  INotificationsServerEvents,
  INotificationsClientEvents
>;

export const getNotificationsSocket = () =>
  getAccountManager().then(
    (manager) =>
      manager.socket(NOTIFICATIONS_SOCKET_NAMESPACE) as INotificationsSocket
  );
