import type {
  IMutableNotificationType,
  INotification,
} from "./notifications.schema";

export const NOTIFICATION_SETTING_LABELS: Record<
  IMutableNotificationType,
  string
> = {
  follow: "New followers",
  "comment-reply": "Replies to my comments",
  "review-comment": "Comments on my reviews",
  "review-helpful": "Likes on my reviews",
  "comment-like": "Likes on my comments",
  "list-like": "Likes on my lists",
  "request-decided": "Decisions on my requests",
  "wishlist-release": "Releases of games on my wishlist",
};

export interface INotificationText {
  actors: string | null;
  action: string;
  subject: string | null;
}

export const ALERT_NOTIFICATION_TYPES: INotification["type"][] = [
  "comment-reply",
  "review-comment",
  "request-decided",
  "wishlist-release",
];

export const isAlertNotification = (
  notification: Pick<INotification, "type">
) => ALERT_NOTIFICATION_TYPES.includes(notification.type);

export const getActorsLabel = ({
  actors,
  actorsCount,
}: Pick<INotification, "actors" | "actorsCount">) => {
  const names = actors.map((actor) => actor.userName);

  if (!names.length) return actorsCount ? "Someone" : null;
  if (actorsCount === 1) return names[0];
  if (actorsCount === 2 && names.length === 2) return names.join(" and ");
  if (actorsCount === 3 && names.length === 3) {
    return `${names[0]}, ${names[1]} and ${names[2]}`;
  }

  const others = actorsCount - Math.min(names.length, 2);

  return `${names.slice(0, 2).join(", ")} and ${others} ${
    others === 1 ? "other" : "others"
  }`;
};

export const getNotificationText = (
  notification: INotification
): INotificationText => {
  const { payload } = notification;
  const actors = getActorsLabel(notification);
  const game = payload.gameName ?? null;

  switch (notification.type) {
    case "follow":
      return { actors, action: "started following you", subject: null };
    case "comment-reply":
      return { actors, action: "replied to your comment on", subject: game };
    case "review-comment":
      return { actors, action: "commented on your review of", subject: game };
    case "review-helpful":
      return {
        actors,
        action: "liked your review of",
        subject: game,
      };
    case "comment-like":
      return { actors, action: "liked your comment on", subject: game };
    case "list-like":
      return {
        actors,
        action: "liked your list",
        subject: payload.listName ?? null,
      };
    case "request-decided":
      return {
        actors: null,
        action: `Your ${payload.requestKind ?? "content"} request ${
          payload.decision === "approved" ? "was approved" : "was rejected"
        }:`,
        subject: payload.requestName ?? "untitled",
      };
    case "wishlist-release":
      return {
        actors: null,
        action: "A game on your wishlist is out today:",
        subject: game,
      };
    case "comment-moderated":
      return {
        actors: null,
        action: `A moderator ${
          payload.status === "deleted" ? "removed" : "hid"
        } your comment on`,
        subject: game,
      };
  }
};

export const getNotificationHref = (
  notification: INotification,
  viewerName?: string
) => {
  const { payload } = notification;

  switch (notification.type) {
    case "follow":
      return notification.actors[0]
        ? `/user/${notification.actors[0].userName}`
        : null;
    case "list-like":
      return viewerName && payload.listSlug
        ? `/user/${viewerName}/lists/${payload.listSlug}`
        : null;
    case "request-decided":
      return "/requests";
    case "review-helpful":
      return payload.gameSlug ? `/games/${payload.gameSlug}#reviews` : null;
    case "wishlist-release":
      return payload.gameSlug ? `/games/${payload.gameSlug}` : null;
    default:
      return payload.gameSlug ? `/games/${payload.gameSlug}#discussion` : null;
  }
};

export const getNotificationSentence = (notification: INotification) => {
  const { actors, action, subject } = getNotificationText(notification);

  return [actors, action, subject].filter(Boolean).join(" ");
};
