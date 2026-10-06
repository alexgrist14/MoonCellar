import { z } from "zod";
import { ObjectIdSchema } from "./utils";

export const ACTIVITY_SOCKET_NAMESPACE = "/activity";
export const ACTIVITY_ROOMS_LIMIT = 10;

export enum ActivitySocketEvent {
  FOLLOW = "activity:follow",
  UNFOLLOW = "activity:unfollow",
  CHANGED = "activity:changed",
}

export const ActivityRoomRequestSchema = z.object({
  userId: ObjectIdSchema.describe(
    "User whose activity feed the socket follows"
  ),
});

export const ActivityRoomResponseSchema = z.object({
  ok: z.boolean().describe("Whether the socket joined or left the room"),
  error: z.string().optional().describe("Why the request was rejected"),
});

export const ActivityChangedEventSchema = z.object({
  userId: z.string().describe("User whose activity changed, the room"),
});

export type IActivityRoomRequest = z.infer<typeof ActivityRoomRequestSchema>;
export type IActivityRoomResponse = z.infer<typeof ActivityRoomResponseSchema>;
export type IActivityChangedEvent = z.infer<typeof ActivityChangedEventSchema>;

export type IActivityServerEvents = {
  [ActivitySocketEvent.CHANGED]: (event: IActivityChangedEvent) => void;
};

type IActivityRoomHandler = (
  request: IActivityRoomRequest,
  ack?: (response: IActivityRoomResponse) => void
) => void;

export type IActivityClientEvents = {
  [ActivitySocketEvent.FOLLOW]: IActivityRoomHandler;
  [ActivitySocketEvent.UNFOLLOW]: IActivityRoomHandler;
};
