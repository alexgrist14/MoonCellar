# RetroAchievements integration

[RetroAchievements](https://retroachievements.org) (RA) offers achievement sets for retro games.
MoonCellar uses it in two ways:

- **Catalogue.** Each game is linked to its RA sets, with their icons and achievement counts.
- **Connected accounts.** A player connects an RA account in **Settings → RetroAchievements**;
  their awards appear on their profile and game cards, and can become playthroughs.

Every call to RA uses `@retroachievements/api` with the API's RA key.

## Catalogue: achievement sets on games

RA data is never stored in collections of its own; it lives on the records that use it:

| Record | Field | Holds |
|---|---|---|
| Game | `retroachievements[]` | One entry per linked set: `gameId` (RA set id), `consoleId`, `consoleName`, `imageIcon` (absolute URL), `numAchievements` |
| Platform | `raId` | The RA console the platform maps to |
| Conflict (`source: "ra"`) | `externalData` | A snapshot of an ambiguous RA set, since it has no game to live on: `id`, `title`, `consoleId`, `consoleName`, `cover` (box art path from `getGame`), `numAchievements` |

### Nightly sync

`RetroachService.sync` runs nightly at 04:00 Moscow time (`RA_SYNC_CRON`), or by hand with
`POST /ra/sync` (admin). Each run:

1. **Consoles.** Downloads RA's console list and maps each console to a platform by a shared name
   segment (`matchConsolesToPlatforms`). Some IGDB names never share a segment with RA's ("Family
   Computer" against "NES/Famicom"); `RA_CONSOLE_BY_PLATFORM_SLUG` maps those by hand.
2. **Sets.** Downloads every console's game list, then matches each set to games on that console's
   platforms with the shared matcher (`games/matching`). The search is fuzzy (fuzzysort,
   threshold `RA_NAME_MATCH_THRESHOLD`).
3. **Conflicts.** A match is ambiguous when the two best scores differ by less than
   `RA_AMBIGUITY_GAP` (0.05). Such a set becomes an `ra` conflict in the admin Conflicts tab, with
   up to 5 candidates. One RA set can cover several games ("Pokémon HeartGold | SoulSilver"), so
   an RA conflict accepts several winners.
4. **Links.** Links are recomputed, but decisions are kept:
   - a resolved conflict pins its winners;
   - a pending or skipped conflict links nothing;
   - a set the run gave to another game is pulled from the old one;
   - a link is never cleared just because nothing matched it this time.
5. **Missing data.** Every linked set without its icon or count is filled in
   (`fillMissingSetData`): from the downloaded lists, or with one `getGameExtended` per set, up to
   `RA_MISSING_SET_LOOKUPS` (300) per run.
6. **Awards.** Then the awards of every connected account are refreshed (see below).

**Setting an RA id by hand.** An admin can link one game to one RA set in the game's Admin menu
or on its edit page: `POST /ra/games/parse?raId=`. With an empty field, the button re-reads the
sets already linked. The link is pinned through a resolved conflict (`ConflictsService.pin`), so
the next sync keeps it. Open conflicts that list the game end; decided ones stay. A content
request approved with RA ids is pinned the same way.

### Where it shows

- **Game page.** The "Achievements" block shows the RA medal and the sum of the game's sets.
- **Game cards.** An RA medal in the bottom-right corner opens `GameAchievementsPopover`: each
  set with its console, icon and count, and the viewer's award (Beaten or Mastered with its date)
  when they have one. The medal is yellow when the viewer mastered a set, green when they beat
  one, and grey otherwise.
- **Filters.** The "Achievements" dropdown under "Filters" (`achievements`: `ra`, `both`, `any`)
  keep games with RA sets, on the Games page, in Gauntlet, on lists and on the
  Steam tab. The values are in [`steam.md`](./steam.md#filters).

## Connected accounts

### Connecting

RA has no OAuth for third parties, so an account is proved through its motto. A typed name alone
is never trusted.

1. `POST /user/ra/connect` stores a pending `mooncellar-…` code for 30 minutes (`raPending`).
2. The user puts the code into their motto on retroachievements.org.
3. `POST /user/ra/verify` reads the motto with `getUserProfile`. On a match it saves
   `raUsername`, `raUlid`, `raUserPic` and `raVerifiedAt`, and loads the awards.

One RA account belongs to one verified MoonCellar user. RA usernames can change, so users are
looked up by `raUlid` wherever possible. `DELETE /user/ra` disconnects the account and clears its
awards.

### Awards

The visible awards of the account (`getUserAwards`) are stored in `user.raAwards`. They are
refreshed:

- after verify;
- by the **Update awards** button in Settings (`POST /user/ra/sync`), at most once a minute per user
  (`raSyncedAt`);
- nightly after the catalogue sync, for every connected account.

**One award stands for one game, even when its set is linked to several.** `pickGamesForSets`
gives each set to one game: the one the user has a playthrough of, then the one they rated, then
the most rated one.

### Playthroughs

With **Mark playthroughs from awards** on in Settings (`settings.raSyncPlaythroughs`, off
by default), `RaPlaythroughsService.sync` turns awards into playthroughs. It runs after every
awards refresh, and when the toggle is switched on (`POST /user/ra/playthroughs/sync`).

| Award | Playthrough |
|---|---|
| Mastery or Completion | Completed, mastered, dated by the award |
| Game Beaten | Completed, dated by the award |

- **Never touches yours.** A game with a playthrough the user made is left alone.
- **Only upgrades.** An automatic playthrough carries `raGameId` and is only ever upgraded to
  mastered.
- **No feed entries.** It writes no user log, so a first import of dozens of awards does not
  flood the feed.
- **Deleting is final.** Deleting an automatic playthrough adds its set to `raIgnoredSets`, and
  it is not created again.

### Where it shows

- **Profile → RetroAchievements tab** (`UserRaGames`, `GET /user/ra/:userId/games`). Games with
  an award, sorted by best status (Mastered, Completed, Beaten, Beaten (softcore)) and newest
  award first within it, 24 per page.
- **Profile → main tab.** A two-row block with mastered games first.
- **Game cards.** The medal colour and the popover (above).
- **Settings.** Connect, Update awards, the playthrough toggle, Change account and Disconnect.

## Endpoints

| Method | Path | Does |
|---|---|---|
| `POST` | `/ra/sync` | Run the catalogue sync now (admin) |
| `POST` | `/ra/games/parse?gameId&raId` | Link a game to a set, or re-read its sets (admin) |
| `POST` | `/ra/awards/parse` | Refresh the awards of every connected account (admin) |
| `POST` | `/user/ra/connect` | Start connecting: issue the motto code |
| `POST` | `/user/ra/verify` | Check the motto and connect the account |
| `POST` | `/user/ra/sync` | Refresh the viewer's awards |
| `POST` | `/user/ra/playthroughs/sync` | Create playthroughs from the stored awards |
| `DELETE` | `/user/ra` | Disconnect the account |
| `GET` | `/user/ra/:userId/games` | A user's awarded games, one per award |
| `GET` | `/user/ra/:raUsername` | A user's RA achievements, read from RA |
