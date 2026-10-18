import { createHmac } from "node:crypto";
import type { IGameSignalTurn } from "@mooncellar/schemas";

export const TURN_TTL_SECONDS = 12 * 60 * 60;

export function turnCredentials(
  secret: string,
  urls: string[],
  room: string,
  nowMs: number,
  ttlSeconds = TURN_TTL_SECONDS
): IGameSignalTurn {
  const expiry = Math.floor(nowMs / 1000) + ttlSeconds;
  const username = `${expiry}:${room}`;
  const credential = createHmac("sha1", secret)
    .update(username)
    .digest("base64");
  return { urls, username, credential, ttl: ttlSeconds };
}

export function turnUrls(value: string | undefined) {
  return (value ?? "")
    .split(",")
    .map((url) => url.trim())
    .filter((url) => url.length > 0);
}
