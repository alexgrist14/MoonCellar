import type { Socket } from "socket.io-client";
import {
  IVndbReviewClientEvents,
  IVndbReviewServerEvents,
  VNDB_REVIEW_SOCKET_NAMESPACE,
} from "@mooncellar/schemas";
import { API_URL } from "../constants";

export type IVndbReviewSocket = Socket<
  IVndbReviewServerEvents,
  IVndbReviewClientEvents
>;

export const createVndbReviewSocket = () =>
  import("socket.io-client").then(({ Manager }) =>
    new Manager<IVndbReviewServerEvents, IVndbReviewClientEvents>(API_URL, {
      autoConnect: false,
      withCredentials: true,
    }).socket(VNDB_REVIEW_SOCKET_NAMESPACE)
  );
