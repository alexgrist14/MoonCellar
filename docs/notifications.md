# Notifications

A signed-in user gets a notification when something happens to them or to what they wrote: a new
follower, a reply, a comment on their review, a like, a decision on their request, a moderator
acting on their comment. Activity of the people they follow is not a notification; it stays in the
profile activity feed.

The bell in the header shows the unread count and the latest 20; `/notifications` lists them all.
Opening the bell always refetches and holds a loader (at least 400 ms) until the fresh list
arrives (`NotificationsFeed isFreshOnly`), because the cached list from the previous opening would
otherwise flash before the new one replaces it.
Delivery is in-app plus web push on the devices a user turned it on for; e-mail is not planned
yet. Each user can turn types off under Settings → Notifications.

## Types

| Type | Recipient | Written by | Groups by | Links to |
|---|---|---|---|---|
| `follow` | The followed user | `UserFollowingsService.addUserFollowing` | One group per recipient | The first follower's profile |
| `comment-reply` | Author of the comment replied to | `CommentsService.createComment` | Nothing: each reply is its own | `/games/<slug>#discussion` |
| `review-comment` | Author of the review | `CommentsService.createComment` | The review | `/games/<slug>#discussion` |
| `review-helpful` | Author of the review | `ReviewsService.setHelpful` | The review | `/games/<slug>#reviews` |
| `comment-like` | Author of the comment | `CommentsService.setLike` | The comment | `/games/<slug>#discussion` |
| `list-like` | Owner of the list | `CustomListsService.setLike` | The list | The list |
| `request-decided` | Author of the request | `ContentRequestsService.decide` | Nothing | `/requests` |
| `wishlist-release` | Everyone with the game in `wishlist` | `WishlistReleasesService`, daily at 09:00 Moscow | Nothing: one per game | The game page |
| `comment-moderated` | Author of the comment | `CommentsService.changeStatus` (hide or delete by someone else) | The comment | `/games/<slug>#discussion` |

`#discussion` opens the game page's Discussion tab and `#reviews` its Reviews tab, and both
scroll to the block (`GameCommunity`).

## Settings

`user.settings.mutedNotifications` lists the types a user turned off; `notify()` writes nothing of
a muted type. Every type except `comment-moderated` can be muted (`MUTABLE_NOTIFICATION_TYPES`):
a moderator's action on your comment is always reported. The toggles are in the profile Settings
tab, one per type, and save with the rest of the form.

## Wishlist releases

`WishlistReleasesService.notifyReleasedToday` runs every day at 09:00 Moscow time
(`WISHLIST_RELEASE_CRON`). It takes the games whose `first_release` falls on the current UTC day,
keeps only those whose release date for that day is exact — `human` reads like `Oct 05, 2026`
and is not `Dec 31, …`, which IGDB uses for a year-only date — and notifies every user who has the
game in `wishlist`. It skips a user who already has a `wishlist-release` notification for that
game, read or not, so a second run on the same day (another process, a manual call) sends nothing
twice. A real 31 December release is never announced.

## How a notification is stored

One document in `notifications` per group of events:

| Field | Meaning |
|---|---|
| `userId` | Recipient |
| `type` | One of the types above |
| `subjectId` | What it is about: the comment, review, list, request, or the recipient for `follow` |
| `groupKey` | `type:subjectId` |
| `actorIds` | Everyone behind it, latest first; empty for moderation and requests |
| `payload` | What the text and the link need: game slug and name, list slug and name, decision, request kind and name, the moderator's reason, the moderation status |
| `isRead`, `readAt` | Read state |
| `createdAt`, `updatedAt` | `updatedAt` moves whenever an event joins the group; the list sorts by it |

- **Grouping.** An event upserts the unread document with its `groupKey` (unique partial index on
  `userId` + `groupKey` where `isRead: false`), so three likes on one comment read "Anna, Bob and
  1 other liked your comment". Once the group is read, the next like starts a new one.
- **State, not text.** Every sentence and link is built from `type` and `payload` by
  `getNotificationText` / `getNotificationHref` in `packages/schemas/src/notifications.utils.ts`,
  shared by the web and by the API, which needs the sentence for push. The activity feed works the
  same way.
- **Undo.** Unliking or unfollowing removes that person from the unread group, and an empty group
  is deleted. A read group keeps them.
- **Moderation.** Hiding or deleting a comment deletes every notification whose subject is that
  comment (its likes, the reply it was), then tells the author unless they deleted it themselves.
- **Never about yourself.** An event whose actor is the recipient writes nothing.
- **Retention.** A TTL index removes notifications 90 days after `createdAt`.
- **Failure.** `notify()` logs and swallows its errors, and callers do not await it: a failed
  notification never fails the like, reply or decision that caused it.

## API

| Method | Path | Body / query | Answer |
|---|---|---|---|
| `GET` | `/notifications` | `before` (ISO `updatedAt` of the last loaded item), `take` (1–50, default 20), `unread` (`"true"`) | `{ items, unreadCount, nextCursor }` |
| `GET` | `/notifications/unread-count` | — | `{ unreadCount }` |
| `PATCH` | `/notifications/read` | `{ ids }` or `{ all: true }` | `{ unreadCount }` |
| `DELETE` | `/notifications/:id` | — | `{ unreadCount }` |

All four need a session and act on the viewer's own notifications. An item carries the first three
actors (`_id`, `userName`, `avatar`) and `actorsCount`. An item with no actors at all is from the
site itself and shows the MoonCellar icon (`SYSTEM_USER_AVATAR`) in the avatar slot.

## Web push

The alert types — `comment-reply`, `review-comment`, `request-decided`, `wishlist-release`
(`ALERT_NOTIFICATION_TYPES`) — also show a toast in an open tab and go out as web push. Likes and
follows never push.

| Piece | Where |
|---|---|
| Keys | `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT` in the API env (`docs/deploy-env.md`). Without them `GET /notifications/push/public-key` answers `null` and the toggle is hidden |
| Subscriptions | `pushsubscriptions`: `userId`, `endpoint` (unique), `keys`. `POST` / `DELETE /notifications/push/subscriptions` |
| Sending | `PushService.sendToUser`, called by `notify()` for an alert type. A push service answering 404 or 410 deletes that subscription |
| Worker | `apps/web/public/worker.js`, registered on every page load from `src/app/providers.tsx`: shows the notification with the MoonCellar icon and opens its link on click, and serves `offline.html` when a page navigation fails. Not `sw.js`, which stays the old kill switch |
| Toggle | Settings → Notifications → "Push notifications on this device" (`usePushSubscription`): registers the worker, asks for permission, subscribes |

- **The endpoint is checked against known push services** (`PUSH_SERVICE_HOSTS`: FCM, Mozilla,
  Apple, Windows), https only. The API POSTs to whatever endpoint it stores, so an arbitrary URL
  would let anyone make the server call the cloud metadata address or the internal network.
- **Signing out removes this browser's subscription** (`unsubscribePush` in `logout`, before the
  session is cleared), or the device would keep receiving the previous account's pushes.
- A muted type is not pushed either: `notify()` returns before writing anything.
- **No push service → tab mode.** When subscribing fails (ungoogled Chromium builds such as
  Helium, Chromium without Google API keys, a server without VAPID keys) but notification
  permission was granted, the toggle stays on in tab mode: `localStorage["tab-notifications"]`.
  While a MoonCellar tab is open but its window is not focused (`document.hasFocus()`), an alert
  type arriving over the socket is shown with the `Notification` API instead of a toast; a focused
  tab gets the toast. Not `visibilityState`: a window behind another one still reads `visible`.
- **The toggle is per browser.** A push subscription belongs to one browser (one row in
  `pushsubscriptions`), tab mode to one browser's `localStorage`, and permission to one browser.
  Signing out clears both. The type toggles are per account (`user.settings`).
- **"Registration failed - push service error" comes from the browser, not from us.** The worker
  registered and permission was granted, but the browser's own push service refused. Brave keeps
  Google push off until "Use Google services for push messaging" is enabled; Chromium builds without
  Google API keys (flatpak, distribution packages) cannot subscribe at all. The toggle says so.

## Real time

The `/notifications` Socket.IO namespace pushes `notification:new` and `notifications:count` to the
recipient's tabs. Its contract and lifecycle are in [`sockets.md`](./sockets.md#notifications-user-notifications).

## Adding a type

1. Add it to `NOTIFICATION_TYPES` and, if it needs new data, to `NotificationPayloadSchema` in
   `packages/schemas/src/notifications.schema.ts`.
2. Call `NotificationsService.notify()` after the write that causes it, without `await`, and
   `retract()` where the action can be undone. Import `NotificationsModule` into every module that
   provides the calling service.
3. Add its sentence and link to `getNotificationText` and `getNotificationHref`
   (`packages/schemas/src/notifications.utils.ts`), to `ALERT_NOTIFICATION_TYPES` if it deserves a
   toast and a push, and to `MUTABLE_NOTIFICATION_TYPES` and `NOTIFICATION_SETTING_LABELS` if users
   may turn it off.
4. Add a row to the table above.
