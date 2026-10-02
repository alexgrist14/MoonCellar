# NotificationsPage

The signed-in user's notifications: every type, newest activity first, with an All / Unread switch,
"Mark all as read" and per-item removal. Guests see a "Log in" prompt. The header bell
(`widgets/notifications/NotificationsBell`) shows the latest 20 and links here.

## Routes

- `/notifications` — `src/app/notifications/page.tsx`, static metadata, `robots: noindex,
  nofollow`.
- Client-only content: the route fetches nothing.

## Data

- `useAuthStore().isAuth` — decides between the feed and the login prompt.
- `useUnreadNotificationsQuery` — the count on the Unread tab and whether "Mark all as read" is
  enabled; kept current by `useNotificationsSync` (`Layout`) over the `/notifications` socket.
- `widgets/notifications/NotificationsFeed` runs `useNotificationsQuery(isUnread)` — an infinite
  query paged by `before` (the last item's `updatedAt`), 20 at a time, with "Show more".
- The tab lives in component state, not in the URL.

## Composition

1. `Box` → `Breadcrumbs` (Home / Notifications).
2. Header: `SectionTitle as="h1"` "Notifications" and "Mark all as read".
3. `Tabs theme="segmented"`: All, Unread (with the count).
4. `NotificationsFeed isPaged` — `entities/notification/ui/NotificationItem` rows with a remove
   button; opening an unread item marks it read.

## Rules and gotchas

- **The sentence and the link of an item come from `getNotificationText` / `getNotificationHref`
  in `@mooncellar/schemas`, never from the API.** The API stores state only; a new type needs a
  case in both.
- **Comment notifications link to `/games/<slug>#discussion`, which only opens the tab.** There is
  no deep link to the comment itself yet: replies sit in collapsed threads and pages.
- What is notified and how events group is in [`docs/notifications.md`](../../../../../../docs/notifications.md).
