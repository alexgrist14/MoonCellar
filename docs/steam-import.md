# Steam library import

A player links a Steam account in **Settings → Steam** and gets their library as a custom list.
The list follows the account: its games come only from Steam, and it is deleted when the account
is unlinked.

## Flow

1. **Sign in.** The settings section asks `GET /steam/account/login-url` for a Steam OpenID 2.0
   sign-in URL whose `return_to` is `<FRONT_URL>/user/<name>/settings`, and sends the browser
   there.
2. **Return.** Steam redirects back to the settings page with `openid.*` query parameters.
   `SteamAccount` takes them out of the URL (`history.replaceState`) and posts them to
   `POST /steam/account/link`.
3. **Verify.** The API checks the assertion (`id_res`, Steam's endpoint, the exact `return_to`
   for that user, a `https://steamcommunity.com/openid/id/<SteamID64>` claimed id), then asks
   Steam to confirm it with `openid.mode=check_authentication`. Only an `is_valid:true` answer
   links the account.
4. **Import.** `IPlayerService/GetOwnedGames` returns the owned app ids. Each one is matched to a
   catalogue game by any of its Steam entries in `externalPages` (an edition or a remaster can
   carry several); the rest are looked up in IGDB `external_games` (`external_game_source = 1`)
   and matched by `igdb.gameId`. IGDB gives an edition the Steam id of its base game ("Hell is
   Us" and "Hell is Us: Deluxe Edition" share one store page), so both steps can find several
   games for one app id; `pickSteamCandidate` then prefers the game whose name equals the Steam
   name, then a game without `versionTitle`, then a "Main Game", instead of whichever came first.
   What is still left is matched by its Steam name normalised
   with `normalizeTitle` against `nameNormalized`, and only when exactly one catalogue game has
   that name — a delisted game IGDB never linked to Steam is found this way, while a remake that
   shares its title with the original is left out rather than guessed. Games found nowhere stay
   out of the list: the response
   reports `matchedCount` of `ownedCount` and lists them in `unmatched`, which the settings
   section opens from a button as a searchable `ActionsMenu` of links to their store pages.
5. **List.** `CustomListsService.syncSourceList` creates or rewrites the user's list with
   `source: "steam"`, named "Steam library" (a number is appended if the name is taken). Games
   are ordered by playtime, most played first; a game already in the list keeps its `addedAt`.

**Update library** in the settings calls `POST /steam/account/sync` and repeats steps 4 and 5.
**Unlink** calls `DELETE /steam/account`, which deletes the list with its likes and removes
`user.steam`.

## Rules

- An imported list cannot be deleted, and its games cannot be added, removed or reordered: the
  API answers 403 and the web hides those controls. The lists popover of a game and the
  bulk "Add to list" modal still show the Steam list, with a disabled checkbox
  (`ListCheckRow isDisabled`), so the player sees whether the game is in their library. Name, description, privacy, ranking and sort
  stay editable.
- The Steam profile must show **Game details** publicly. Otherwise Steam answers an empty
  `response`, and the API refuses with 422 instead of creating an empty list.
- A Steam account can be linked to one MoonCellar profile only (unique `steam.steamId`), and a
  profile has at most one Steam list (unique `userId` + `source`).
- Without `STEAM_API_KEY` the import answers 503; signing in still works, but nothing is linked
  because the link imports in the same request.

## Endpoints

| Method | Path | Does |
|---|---|---|
| `GET` | `/steam/account/login-url` | Steam sign-in URL that returns to the viewer's settings |
| `POST` | `/steam/account/link` | Verify the sign-in, link the account, import the library |
| `POST` | `/steam/account/sync` | Import the linked library again |
| `DELETE` | `/steam/account` | Unlink and delete the Steam list |

All four need the session cookie and the `x-user-id` header (`UserIdGuard`).

## Achievement counts

Separate from the library import: every game with a Steam app id gets
`steamAchievements: { appId, total, updatedAt }`, read from the Steam Web API
(`ISteamUserStats/GetSchemaForGame`). The game page shows it in the "Achievements" block of the
score column, next to the sum of its RetroAchievements sets.

| | |
|---|---|
| Schedule | Nightly at 03:30 Moscow time, up to 60,000 games, one request about every second |
| Order | Games never read, then counts older than 60 days |
| No achievements | `total: 0` (Steam answers `{"game":{}}`, or 400 for an unknown app) |
| Failure | Nothing stored; 10 in a row stop the run |
| Manual | `POST /steam/achievements/sync?limit=`, `POST /steam/achievements/games/:gameId` (admin); the second is the "Parse Steam achievements" button in a game's Admin menu and on its edit page |

## Achievement progress of linked accounts

| | |
|---|---|
| Source | `IPlayerService/GetTopAchievementsForGames` (100 apps per request); `GetPlayerAchievements` for the date a game was fully completed |
| When | After every library import (link, Update library) and nightly at 05:15 Moscow time for every linked account |
| Stored | `user.steam.achievements`: games with at least one unlocked achievement, with their catalogue game when it matched |
| Shown | Settings (counts and the playthrough toggle), the profile's Steam tab and block (progress such as "34 / 51", "Mastered") |
| Playthroughs | Opt-in toggle: a mastered game (every achievement unlocked) gets a Completed + Mastered playthrough on PC |

## Steam games in the catalogue

Every game can carry `steam: { appId, name, updatedAt }`, its Steam app. `SteamGamesService` reads
the whole Steam games list every Monday at 04:00 Moscow time (`POST /steam/games/sync` by hand) and:

| Case | What happens |
|---|---|
| The game already has a Steam page (`externalPages`) | `steam` is filled from it |
| One game has the app's exact name, has PC among its platforms and no Steam page | Linked automatically, Steam page added |
| Several games share the name, or the only one is not on PC or has another Steam app | A `steam` conflict in the admin Conflicts tab |
| No game has the name | Nothing; the app is not imported as a new game |

Matching a conflict links the chosen games and adds their Steam page. Skipping adds the app as a
new game, built from its store page: name, short description, developers and publishers, release
date, PC / Mac / Linux, genres and game modes mapped to the catalogue's names, up to 10
screenshots, the 600×900 library poster as the cover (the header image when there is none) and
the library hero art as the background. The game is saved like one added by hand (`isCustom`),
so a later IGDB match only fills its empty fields; a skipped Steam conflict cannot be reopened.
