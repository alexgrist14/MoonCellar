import { z } from "zod";
import { CommunityAuthorSchema } from "./comments.schema";
import { ObjectIdSchema } from "./utils";

export const NOTIFICATION_TYPES = [
  "follow",
  "comment-reply",
  "review-comment",
  "review-helpful",
  "comment-like",
  "list-like",
  "request-decided",
  "comment-moderated",
  "wishlist-release",
] as const;

export const MUTABLE_NOTIFICATION_TYPES = [
  "follow",
  "comment-reply",
  "review-comment",
  "review-helpful",
  "comment-like",
  "list-like",
  "request-decided",
  "wishlist-release",
] as const satisfies readonly (typeof NOTIFICATION_TYPES)[number][];

export const NOTIFICATIONS_PAGE_SIZE = 20;
export const NOTIFICATION_ACTORS_SHOWN = 3;

export const NotificationTypeSchema = z.enum(NOTIFICATION_TYPES);
export const MutableNotificationTypeSchema = z.enum(MUTABLE_NOTIFICATION_TYPES);

export const NotificationPayloadSchema = z.object({
  gameSlug: z.string().optional().describe("Game the comment belongs to"),
  gameName: z.string().optional(),
  listSlug: z.string().optional().describe("Liked list, owned by the reader"),
  listName: z.string().optional(),
  decision: z
    .enum(["approved", "rejected"])
    .optional()
    .describe("Decision on a content request"),
  requestKind: z.enum(["game", "character"]).optional(),
  requestName: z.string().nullable().optional(),
  reason: z.string().nullable().optional().describe("Moderator's note"),
  status: z
    .enum(["hidden", "deleted"])
    .optional()
    .describe("What a moderator did to the comment"),
});

export const NotificationSchema = z.object({
  _id: z.string(),
  type: NotificationTypeSchema,
  actors: CommunityAuthorSchema.array().describe(
    `The latest ${NOTIFICATION_ACTORS_SHOWN} people behind the notification`
  ),
  actorsCount: z.number().describe("Everyone behind it"),
  payload: NotificationPayloadSchema,
  isRead: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string().describe("Last time an event joined the group"),
});

export const GetNotificationsRequestSchema = z.object({
  before: z.iso
    .datetime()
    .optional()
    .describe("`updatedAt` of the last item already loaded"),
  take: z.coerce.number().int().min(1).max(50).default(NOTIFICATIONS_PAGE_SIZE),
  unread: z
    .enum(["true", "false"])
    .optional()
    .transform((value) => value === "true")
    .describe("Only unread notifications"),
});

export const GetNotificationsResponseSchema = z.object({
  items: NotificationSchema.array(),
  unreadCount: z.number(),
  nextCursor: z.string().nullable(),
});

export const UnreadNotificationsResponseSchema = z.object({
  unreadCount: z.number(),
});

export const MarkNotificationsReadRequestSchema = z
  .object({
    ids: ObjectIdSchema.array().max(100).optional(),
    all: z.boolean().optional(),
  })
  .refine((body) => body.all || !!body.ids?.length, {
    message: "Pass ids or all",
  });

export const NOTIFICATIONS_SOCKET_NAMESPACE = "/notifications";

export enum NotificationsSocketEvent {
  NEW = "notification:new",
  COUNT = "notifications:count",
}

export const NotificationNewEventSchema = z.object({
  notification: NotificationSchema,
  unreadCount: z.number(),
});

export const NotificationsCountEventSchema = UnreadNotificationsResponseSchema;

export type INotificationType = z.infer<typeof NotificationTypeSchema>;
export type IMutableNotificationType = z.infer<
  typeof MutableNotificationTypeSchema
>;
export type INotificationPayload = z.infer<typeof NotificationPayloadSchema>;
export type INotification = z.infer<typeof NotificationSchema>;
export type IGetNotificationsRequest = z.input<
  typeof GetNotificationsRequestSchema
>;
export type IGetNotificationsQuery = z.output<
  typeof GetNotificationsRequestSchema
>;
export type IGetNotificationsResponse = z.infer<
  typeof GetNotificationsResponseSchema
>;
export type IUnreadNotificationsResponse = z.infer<
  typeof UnreadNotificationsResponseSchema
>;
export type IMarkNotificationsReadRequest = z.infer<
  typeof MarkNotificationsReadRequestSchema
>;
export type INotificationNewEvent = z.infer<typeof NotificationNewEventSchema>;
export type INotificationsCountEvent = z.infer<
  typeof NotificationsCountEventSchema
>;

export type INotificationsClientEvents = Record<string, never>;

export type INotificationsServerEvents = {
  [NotificationsSocketEvent.NEW]: (event: INotificationNewEvent) => void;
  [NotificationsSocketEvent.COUNT]: (event: INotificationsCountEvent) => void;
};

export const PUSH_SERVICE_HOSTS = [
  "fcm.googleapis.com",
  "updates.push.services.mozilla.com",
  "web.push.apple.com",
  ".push.apple.com",
  ".notify.windows.com",
];

const isPushServiceUrl = (value: string) => {
  try {
    const { protocol, hostname } = new URL(value);

    return (
      protocol === "https:" &&
      PUSH_SERVICE_HOSTS.some((host) =>
        host.startsWith(".") ? hostname.endsWith(host) : hostname === host
      )
    );
  } catch {
    return false;
  }
};

export const PushEndpointSchema = z
  .string()
  .max(2048)
  .refine(isPushServiceUrl, "Unknown push service");

export const PushSubscriptionRequestSchema = z.object({
  endpoint: PushEndpointSchema,
  keys: z.object({
    p256dh: z.string().min(1).max(256),
    auth: z.string().min(1).max(64),
  }),
});

export const PushUnsubscribeRequestSchema = z.object({
  endpoint: PushEndpointSchema,
});

export const PushPublicKeyResponseSchema = z.object({
  publicKey: z
    .string()
    .nullable()
    .describe("VAPID public key, null when push is not configured"),
});

export const PushPayloadSchema = z.object({
  title: z.string(),
  body: z.string(),
  url: z.string().nullable(),
  tag: z.string(),
});

export type IPushSubscriptionRequest = z.infer<
  typeof PushSubscriptionRequestSchema
>;
export type IPushUnsubscribeRequest = z.infer<
  typeof PushUnsubscribeRequestSchema
>;
export type IPushPublicKeyResponse = z.infer<
  typeof PushPublicKeyResponseSchema
>;
export type IPushPayload = z.infer<typeof PushPayloadSchema>;
