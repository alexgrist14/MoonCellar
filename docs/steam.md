# Steam integration

MoonCellar uses Steam in three independent ways:

- **Catalogue.** Each game is linked to its Steam app, with its achievement count.
- **Linked accounts.** A player links a Steam account in **Settings → Steam**; their library and
  achievement progress appear on their profile and on game cards.
- **Filters.** The Games page, Gauntlet and every list can keep only Steam games or games with
  Steam achievements.

Every call to Steam uses the `STEAM_API_KEY` of the API.

## Catalogue: Steam apps on games

Every game can carry `steam: { appId, name, updatedAt }`, its Steam app. `SteamGamesService` reads
the whole Steam games list (`IStoreService/GetAppList`, about 190,000 games, 50,000 per request).
It runs every Monday at 04:00 Moscow time, or by hand with `POST /steam/games/sync`. Each app is
handled as follows:

| Case | What happens |
|---|---|
| The game already has a Steam page (`externalPages`) | `steam` is filled from it |
| One game has the app's exact name, has PC among its platforms and no Steam page | Linked automatically, Steam page added |
| Several games share the name, or the only one is not on PC or has another Steam app | A `steam` conflict in the admin Conflicts tab |
| No game has the name | Nothing; the app is not imported as a new game |

**Resolving a `steam` conflict**
- **Match** links the chosen games and adds their Steam page.
- **Skip** adds the app as a new game, built from its store page (`appdetails`):
  - name, short description, developers and publishers, release date;
  - PC / Mac / Linux platforms;
  - genres and game modes mapped to the catalogue's names;
  - up to 10 screenshots;
  - the 600×900 library poster as the cover, or the header image when there is none;
  - the library hero art as the background.

  The game is saved like one added by hand (`isCustom`), so a later IGDB match only fills its
  empty fields. A skipped Steam conflict cannot be reopened.

## Catalogue: achievement counts

Every game with a Steam app id gets `steamAchievements: { appId, total, updatedAt }`, read from
`ISteamUserStats/GetSchemaForGame`. The game page shows it in the "Achievements" block with the
Steam logo, next to the sum of its RetroAchievements sets.

| | |
|---|---|
| Schedule | Nightly at 03:30 Moscow time, up to 60,000 games, one request about every second |
| Order | Games never read, then counts older than 60 days |
| No achievements | `total: 0` (Steam answers `{"game":{}}`, or 400 for an unknown app) |
| Failure | Nothing stored; 10 in a row stop the run |
| Manual | `POST /steam/achievements/sync?limit=`, `POST /steam/achievements/games/:gameId` (admin); the second is the "Parse Steam achievements" button in a game's Admin menu and on its edit page |

## Linked accounts

### Linking

1. **Sign in.** The settings section asks `GET /steam/account/login-url` for a Steam OpenID 2.0
   sign-in URL. Its `return_to` is `<FRONT_URL>/user/<name>/settings`, and the browser is sent
   there.
2. **Return.** Steam redirects back to the settings page with `openid.*` query parameters.
   `SteamAccount` removes them from the URL (`history.replaceState`) and posts them to
   `POST /steam/account/link`.
3. **Verify.** The API checks the assertion: `id_res`, Steam's endpoint, the exact `return_to`
   for that user, and a `https://steamcommunity.com/openid/id/<SteamID64>` claimed id. It then
   asks Steam to confirm the assertion with `openid.mode=check_authentication`. Only an
   `is_valid:true` answer links the account.
4. **Import.** The library is read and matched in the same request (next section).

**Update library** calls `POST /steam/account/sync`, which repeats the import. **Unlink** calls
`DELETE /steam/account`, which removes `user.steam` and the stored library.

### Library

`IPlayerService/GetOwnedGames` returns the owned apps, most played first. Each app is matched to a
catalogue game, in this order:

1. **Steam entries in `externalPages`.** An edition or a remaster can carry several.
2. **IGDB `external_games`** (`external_game_source = 1`), matched by `igdb.gameId`.
3. **Steam name.** The name is normalised with `normalizeTitle` and compared to `nameNormalized`.
   It counts only when exactly one catalogue game has that name. This finds a delisted game IGDB
   never linked to Steam, and leaves out a remake that shares its title with the original.

IGDB gives an edition the Steam id of its base game: "Hell is Us" and "Hell is Us: Deluxe Edition"
share one store page. So steps 1 and 2 can find several games for one app, and
`pickSteamCandidate` then prefers:
- the game whose name equals the Steam name;
- then a game without `versionTitle`;
- then a "Main Game".

The matched games are stored in the `steamlibraries` collection, one document per user:
`{ userId, games: [{ appId, gameId, playtime }], syncedAt }`. They are kept out of the user
document, so the library does not travel with every user response. The import's response
reports `matchedCount` of `ownedCount`. It also lists the rest in `unmatched`; the settings
section opens them from a button as a searchable menu of links to their store pages.

The library is read again nightly at 05:15 Moscow time for every linked account
(`SteamAccountService.syncAllCron`), followed by its achievement progress.

Libraries used to be imported as a custom list named "Steam library" (`source: "steam"`). Every
import now deletes that list (`deleteSourceList`). The nightly run therefore removes the old
lists within a day of a deploy. Until an account's first import under the new scheme, `POST /steam/library` builds its
library from that old list and the stored achievement progress, without playtime.

### Achievement progress

| | |
|---|---|
| Source | `IPlayerService/GetTopAchievementsForGames` (100 apps per request); `GetPlayerAchievements` for the date a game was fully completed |
| When | After every library import |
| Stored | `user.steam.achievements`: games with at least one unlocked achievement, with their catalogue game when it matched |
| Playthroughs | Opt-in toggle in Settings (`steamSyncPlaythroughs`): a mastered game (every achievement unlocked) gets a Completed + Mastered playthrough on PC. A game the user already has a playthrough of is left alone, and a deleted automatic playthrough is not added again (`steamIgnoredApps`) |

### Where it shows

- **Profile → Steam tab** (`UserSteamGames`, `POST /steam/library`).
  - **Games:** every library game in the catalogue, 24 per page. Each has its progress ("34 / 51",
    "Mastered" with the date), or its playtime when it has no achievements.
  - **Sort:** Achievements (default: mastered first, newest first, then by progress, games
    without achievements last in either direction), Playtime, Name, Release date or Rating.
  - **Filters:** the catalogue filters from the left "Filters" menu. Sort and filters live in
    the URL (`sort`, `order` and the `/games` filter params).
- **Profile → main tab.** A two-row Steam block, in the default order.
- **Game cards.** A card shows a Steam logo in the bottom-right corner when the viewer has
  progress in that game: grey while in progress, yellow when mastered. It opens
  `GameSteamPopover` with the unlocked count, a progress bar, and buttons to the Steam
  achievements page and the store page.
- **Settings.** Counts and the playthrough toggle.

## Filters

Under "Filters" on the Games page, in Gauntlet, on lists and on the Steam tab:

- **Achievements** is a dropdown, `achievements` in the URL and in `GetGamesRequestSchema`:

  | Option | Value | Keeps |
  |---|---|---|
  | All games | — | every game |
  | Steam | `steam` | games with `steamAchievements.total > 0` |
  | RetroAchievements | `ra` | games with at least one RA set |
  | Both | `both` | games with both |
  | Either | `any` | games with either |

  It replaced the two toggles `isOnlyWithAchievements` and `isOnlyWithSteamAchievements`. Both
  are still read, so old links and saved filters keep working: the site turns them into
  `achievements` when it parses a URL, and the API maps them when `achievements` is absent
  (`gamesFilters`).
- **Steam games** is a toggle, `isOnlySteam`: games with a Steam store page
  (`externalPages.name: "Steam"`).

## Rules

- The Steam profile must show **Game details** publicly. Otherwise Steam answers an empty
  `response`, and the import refuses with 422.
- A Steam account can be linked to one MoonCellar profile only (unique `steam.steamId`).
- Without `STEAM_API_KEY` the import answers 503. Signing in still works, but nothing is linked,
  because the link imports in the same request.

## Endpoints

| Method | Path | Does |
|---|---|---|
| `GET` | `/steam/account/login-url` | Steam sign-in URL that returns to the viewer's settings |
| `POST` | `/steam/account/link` | Verify the sign-in, link the account, import the library |
| `POST` | `/steam/account/sync` | Import the linked library again |
| `POST` | `/steam/account/playthroughs/sync` | Create playthroughs for mastered games now |
| `DELETE` | `/steam/account` | Unlink and delete the stored library |
| `POST` | `/steam/library` | A user's library games with progress, sorted and filtered (public) |
| `POST` | `/steam/games/sync` | Link Steam apps to catalogue games (admin) |
| `POST` | `/steam/achievements/sync` | Read achievement counts (admin) |
| `POST` | `/steam/achievements/games/:gameId` | Read one game's achievement count (admin) |

The `/steam/account` endpoints need the session cookie and the `x-user-id` header
(`UserIdGuard`).
