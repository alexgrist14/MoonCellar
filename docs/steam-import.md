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
  API answers 403 and the web hides those controls. Name, description, privacy, ranking and sort
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
