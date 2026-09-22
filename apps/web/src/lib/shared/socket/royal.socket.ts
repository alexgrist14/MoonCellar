import type { Socket } from "socket.io-client";
import {
  IRoyalClientEvents,
  IRoyalServerEvents,
  ROYAL_SOCKET_NAMESPACE,
} from "@mooncellar/schemas";
import { API_URL } from "@/src/lib/shared/constants";

export type IRoyalSocket = Socket<IRoyalServerEvents, IRoyalClientEvents>;

let royalSocket: Promise<IRoyalSocket> | undefined;

export const getRoyalSocket = () => {
  royalSocket ??= import("socket.io-client")
    .then(({ Manager }) =>
      new Manager<IRoyalServerEvents, IRoyalClientEvents>(API_URL, {
        autoConnect: false,
        withCredentials: true,
      }).socket(ROYAL_SOCKET_NAMESPACE)
    )
    .catch((error) => {
      royalSocket = undefined;
      throw error;
    });

  return royalSocket;
};
