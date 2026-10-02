# UserProfile

A user's public profile: info and activity, games by status, lists, liked lists, favourite
games and characters, reviews, and — for the owner only — settings. Public; the owner gets
editing controls.

## Routes

- `/user/[name]` and `/user/[name]/<tab>` — the page is rendered by the layout
  `src/app/user/[name]/(profile)/layout.tsx`; the child routes return `null` and only shape
  metadata and status:
  - `(profile)/page.tsx` — the Profile tab. It `permanentRedirect`s the legacy
    `?list=<tab>` to `/user/<name>/<tab>`, keeping the other params.
  - `(profile)/[tab]/page.tsx` — `notFound()` for a tab outside `profileTabs`; metadata
    `<Tab label>: <name>`, canonical per tab, `noindex` for `settings`.
  - `(profile)/favourites/[kind]/page.tsx` — `favourites/games` and `favourites/characters`, the
    only two-segment tabs; same metadata through `getProfileTabMetadata`. The layout reads the
    tab with `useSelectedLayoutSegments()` joined by `/`, since a single segment would read
    "favourites" for both.
  - The former `/favorites`, `/characters` and a bare `/favourites` (and `?list=` with those
    names) `permanentRedirect` through `legacyProfileTabs`. They were public URLs; drop an entry
    only once nothing links to it.
- **User-facing text and URLs spell it "favourite(s)".** Code identifiers, the `user.favorites`
  field and the API routes keep `favorites`; renaming those is a data migration, not a copy fix.
- Dynamic (cookies). `getProfileUser` (`profile.data.ts`) is `React.cache`d: it validates the
  name with `GetUserByStringSchema` before calling `userAPI.getByString` through `fetchOrNull`,
  so an impossible username is a 404, not a 500.
- Layout metadata: `Profile: <name>` (with its own `%s | MoonCellar` template for the tabs),
  description from the user's bio, keywords, canonical `/user/<name>`; "Page not found" +
  `noindex` when the user is missing (404), a neutral `{ title: "Profile" }` when the lookup
  fails for any other reason. The tab route's metadata returns `{}` on the same failure.
  `notFound()` is called from the layout component.
- There is no segment `error.tsx`: an API failure bubbles to `src/app/error.tsx`, which renders
  `ErrorPage`. A boundary that rendered `NotFoundPage` answered an outage with a 404 body.

## Data

- Server (layout), in two parallel batches: decode `accessMoonToken` → `authUserId`; the
  viewer's followings together with the profile user; then playthroughs, ratings, followings and followers of that user; favourite games
  (`gamesApi.getByIds`, kept in `favorites` order), public lists, liked lists and favourite
  characters (these four fall back to `[]`).
- Client: `useAuthStore().profile`, `useIsAuthHydrated`, `usePlaythroughsStore` (filled with
  the server's playthroughs for the owner so edits show up immediately). Tab widgets fetch
  their own data.
- The tab is the path segment, read with `useSelectedLayoutSegment()` (`null` → `profile`).
  `UserNavigation` renders each tab as a link (`Button href={getProfileHref(name, tab)}`) — a
  real route change, since each tab is its own route, and crawlable; its `onClick` only closes
  the mobile `ExpandMenu`. Sort state for games and reviews is local `useState`.

## Composition

1. `BGImage` with the user's background (the store's copy for the owner).
2. Mobile only: `ExpandMenu` (bottom-right, burger) with `UserNavigation`.
3. `Box`: `Breadcrumbs` on every tab except Profile, then the tab:
   - `profile` → `widgets/user/UserInfo`
   - `all` and each status → `widgets/user/UserGames`
   - `lists` / `liked` → `widgets/user/UserLists` (`kind="liked"`)
   - `favourites/games` → `widgets/user/FavoriteGames`; `favourites/characters` →
     `FavoriteCharacters`. They are one Favourites page: both routes render a `Tabs` row
     (Games / Characters) whose tabs are `tabLink`s to the two routes, so the URL is the selected
     tab and "All" on the Profile tab opens the right one. The navigation has a single Favourites
     entry, active on both, counting both lists.
   - `reviews` → `widgets/user/UserReviews`
   - `settings` → `features/user/ui/Settings`, owner only; its "Danger zone" opens `features/user/ui/DeleteAccountModal`, which asks for the password, calls `DELETE /user/account/:userId`, clears the auth store and the React Query cache and goes home
4. Desktop column: `features/user/ui/UserNavigation` (tabs and counts; sorting lives in `UserGames` and `UserReviews`, above their content).
   Its first block — avatar and name, linking to Profile and active there — is shown on every
   tab. Settings is not a tab in it: the owner reaches it from the gear icon at the right of
   that block, and from the account menu in the header.

## Rules and gotchas

- **Trust the cookie's `authUserId` only when the store's profile has the same id.** A browser
  logged out in the store but holding a live cookie got owner controls, and every owner request
  failed with `400 Wrong user`. On disagreement the page calls `refreshAuth`.
- **Use `useIsAuthHydrated`, never `typeof window`, to keep the cookie's answer during
  hydration.** The first client render must equal the server's; a `typeof window` check made the
  owner's Lists tab exist only on the server and failed hydration.
- **Never gate a loader on `isPending`.** A disabled `useGamesByIdsQuery` stays pending forever,
  which once hid the "List is empty" placeholder behind an endless spinner.
- **The activity feed's columns are divisors of `takeLogs` (24).** `ActivityTimeline.module.scss`
  duplicates the entry width and `--gap-x6` for its container queries; change them together.
- **Two `Dropdown`s side by side need `flex: 1 1 0; min-width: 0` from the parent module** —
  `Dropdown`'s 170px minimum pushed the rating filter off a phone screen.
- **Open long content (reviews, comments) in the shared drawer**, never a panel of your own; the
  drawer is what keeps it off the bottom-right Menu.
- `PATCH profile-time` (`userAPI.updateUserTime`) fires only when the viewer is the owner.
