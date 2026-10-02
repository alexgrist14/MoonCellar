import type { Manager } from "socket.io-client";
import { API_URL } from "@/src/lib/shared/constants";

let accountManager: Promise<Manager> | undefined;

export const getAccountManager = () => {
  accountManager ??= import("socket.io-client")
    .then(
      ({ Manager }) =>
        new Manager(API_URL, { autoConnect: false, withCredentials: true })
    )
    .catch((error) => {
      accountManager = undefined;
      throw error;
    });

  return accountManager;
};
