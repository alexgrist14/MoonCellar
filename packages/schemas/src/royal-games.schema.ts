import { z } from "zod";
import { ObjectIdSchema } from "./utils";

export const ROYAL_SOCKET_NAMESPACE = "/royal";
export const ROYAL_GAMES_LIMIT = 500;

export enum RoyalSocketEvent {
  SYNC = "royal:sync",
  ADD = "royal:add",
  REMOVE = "royal:remove",
  SET = "royal:set",
  CHANGED = "royal:changed",
}

const RoyalGameIdsSchema = ObjectIdSchema.array().max(ROYAL_GAMES_LIMIT);

export const RoyalGamesPositionSchema = z.enum(["start", "end"]);

export const AddRoyalGamesRequestSchema = z.object({
  gameIds: RoyalGameIdsSchema.min(1).describe("Games to add, in order"),
  position: RoyalGamesPositionSchema.default("end").describe(
    "Whether the new games go before or after the current list"
  ),
});

export const RemoveRoyalGamesRequestSchema = z.object({
  gameIds: RoyalGameIdsSchema.min(1).describe("Games to remove"),
});

export const SetRoyalGamesRequestSchema = z.object({
  gameIds: RoyalGameIdsSchema.describe("The whole list, in order"),
});

export const RoyalGamesSuccessSchema = z.object({
  ok: z.literal(true),
  royalGames: z.string().array().describe("The list after the request"),
  rejected: z
    .string()
    .array()
    .describe("Requested games missing from the list: unknown or over the limit"),
});

export const RoyalGamesFailureSchema = z.object({
  ok: z.literal(false),
  error: z.string().describe("Why nothing was changed"),
});

export const RoyalGamesResponseSchema = z.discriminatedUnion("ok", [
  RoyalGamesSuccessSchema,
  RoyalGamesFailureSchema,
]);

export const RoyalGamesChangedEventSchema = z.object({
  royalGames: z
    .string()
    .array()
    .describe("The list after a change made by another socket of the user"),
});

export type IRoyalGamesPosition = z.infer<typeof RoyalGamesPositionSchema>;
export type IAddRoyalGamesRequest = z.input<typeof AddRoyalGamesRequestSchema>;
export type IRemoveRoyalGamesRequest = z.infer<
  typeof RemoveRoyalGamesRequestSchema
>;
export type ISetRoyalGamesRequest = z.infer<typeof SetRoyalGamesRequestSchema>;
export type IRoyalGamesResponse = z.infer<typeof RoyalGamesResponseSchema>;
export type IRoyalGamesChangedEvent = z.infer<
  typeof RoyalGamesChangedEventSchema
>;

type IRoyalGamesAck = (response: IRoyalGamesResponse) => void;

export type IRoyalClientEvents = {
  [RoyalSocketEvent.SYNC]: (
    request: Record<string, never>,
    ack: IRoyalGamesAck
  ) => void;
  [RoyalSocketEvent.ADD]: (
    request: IAddRoyalGamesRequest,
    ack: IRoyalGamesAck
  ) => void;
  [RoyalSocketEvent.REMOVE]: (
    request: IRemoveRoyalGamesRequest,
    ack: IRoyalGamesAck
  ) => void;
  [RoyalSocketEvent.SET]: (
    request: ISetRoyalGamesRequest,
    ack: IRoyalGamesAck
  ) => void;
};

export type IRoyalServerEvents = {
  [RoyalSocketEvent.CHANGED]: (event: IRoyalGamesChangedEvent) => void;
};
