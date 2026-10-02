import type { Socket } from "socket.io-client";
import {
  IRoyalClientEvents,
  IRoyalServerEvents,
  ROYAL_SOCKET_NAMESPACE,
} from "@mooncellar/schemas";
import { getAccountManager } from "./account.socket";

export type IRoyalSocket = Socket<IRoyalServerEvents, IRoyalClientEvents>;

export const getRoyalSocket = () =>
  getAccountManager().then(
    (manager) => manager.socket(ROYAL_SOCKET_NAMESPACE) as IRoyalSocket
  );
