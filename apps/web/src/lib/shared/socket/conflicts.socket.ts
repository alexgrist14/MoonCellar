import type { Socket } from "socket.io-client";
import {
  CONFLICTS_SOCKET_NAMESPACE,
  IConflictsClientEvents,
  IConflictsServerEvents,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";

export type IConflictsSocket = Socket<
  IConflictsServerEvents,
  IConflictsClientEvents
>;

export const createConflictsSocket = () =>
  import("socket.io-client").then(({ Manager }) =>
    new Manager<IConflictsServerEvents, IConflictsClientEvents>(API_URL, {
      autoConnect: false,
      withCredentials: true,
    }).socket(CONFLICTS_SOCKET_NAMESPACE)
  );
