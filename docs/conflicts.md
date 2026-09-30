# Parser conflicts and the shared game matcher

Every parser that brings games or game data into the catalogue (VNDB, IGDB, HowLongToBeat,
RetroAchievements) now decides "is this the same game?" through one matcher, and puts the cases it
cannot decide into one admin queue, the **Conflicts** tab. Before this, only VNDB had a review
queue. IGDB matched on `igdb.gameId` alone, so a game added by hand got a second IGDB copy with a
`-2` slug. HLTB dropped unclear matches silently, and RA linked whatever fuzzy match scored best.

This document describes what changed, how each source behaves now, and how to roll the change out,
including the one data migration it needs. The rules that must not be broken while editing the
code are in `apps/api/CLAUDE.md` (sections IGDB and Conflicts).

## What changed, phase by phase

| Phase | Change | Main files |
|---|---|---|
| 0 | Snapshot spec that pins the VNDB verdicts before anything moved | `apps/api/src/module/games/matching/vndb-match.characterization.spec.ts` |
| 1 | VNDB scoring moved out of `VndbService` into a shared matcher, behaviour unchanged | `apps/api/src/module/games/matching/` |
| 2 | `vndbcandidates` replaced by a generic `conflicts` collection, module and admin tab | `apps/api/src/module/conflicts/`, `apps/web/src/lib/widgets/admin/Conflicts/` |
| 3 | The nightly IGDB sync checks a new game against the catalogue before inserting it | `apps/api/src/module/igdb/igdb.service.ts` |
| 4 | Adding a game by hand warns about likely duplicates | `games.service.ts`, `content-requests.service.ts`, `mcp/game-adder/index.ts` |
| 5 | HLTB and RA send their unclear matches to Conflicts | `hltb.service.ts`, `retroach.service.ts` |

### Phase 1 — the shared matcher

- `game-matcher.utils.ts` holds `resolveMatch`: the former VNDB scoring (title tiers, release
  dates, companies, platforms, genre, type, description), the score threshold and gap, and the
  rejection reasons. It takes an `IMatchSubject` (the entry from the source) and a list of
  catalogue candidates, and returns `matched`, `ambiguous` or `absent` with the scored candidates.
- `game-matcher.service.ts` finds the candidates in Mongo (title keys, then a company fallback),
  loads platform slugs, and runs the duplicate check of phase 4.
- `match-profiles.ts` holds the rules per source. `VNDB_MATCH_PROFILE` is the old constants;
  `IGDB_MATCH_PROFILE` switches the visual-novel genre signal off, scores the game type by
  "same type / re-edition against original", and sets `reviewCustomGames`.
- `reviewCustomGames: true` turns any verdict with a hand-made game (`isCustom`) among the viable
  candidates into a conflict with reason `custom-game`. The VNDB profile keeps it off, so VNDB
  behaviour did not change.
- `VndbService` keeps only the adapter `toVndbMatchSubject` and calls the matcher. It shrank from
  2,608 to about 2,090 lines.

### Phase 2 — the conflicts module

- One collection, `conflicts`, keyed by `(source, externalId)` with a unique index. A record holds
  the source entry's name, the reason, the scored `candidates` (catalogue games) or `entries`
  (source entries, see directions below), the status (`pending`, `resolved`, `absent`), the
  queued decision and who made it.
- `ConflictsService` owns the queue: listing, the per-source summary, the review item, recording a
  decision, and applying decisions in the background. It never imports a parser. A parser
  registers a handler in `onModuleInit`:
  - `describe(externalId)` — the live entry shown on the review screen;
  - `apply(decisions)` — writes a decided batch and returns the game id per applied entry, or
    `null` for an entry applied without a game. An entry left out of the map goes back to review.
- REST moved from `/vndb/candidates*` to `/conflicts*`, and the socket namespace from
  `/vndb-review` to `/conflicts` (see `docs/sockets.md`).
- The admin tab `VNDB candidates` became `Conflicts`, with a count of waiting conflicts, a source
  filter (All / VNDB / IGDB / HLTB / RetroAchievements), and the same review screen and keyboard
  shortcuts as before. The URL is `/admin?tab=conflicts&source=<source>&conflict=<externalId>`.

### Phase 3 — IGDB

- `syncGamesFromIgdb` (the nightly sync) passes `matchNew`. For an IGDB game with no stored
  `igdb.gameId`, `matchNewIgdbGame` runs the matcher first:
  - `absent` — the game is inserted as before;
  - `matched` with a parser-created game, and `IGDB_AUTO_LINK=true` — the existing game gets the
    `igdb.gameId`, and the next sync updates it;
  - anything else — a conflict with source `igdb`; nothing is inserted.
- A hand-made game is never linked automatically, whatever `IGDB_AUTO_LINK` says.
- An explicit parse by id (admin button, content request approval, backfill) skips the check: the
  intent to create or update that exact IGDB game is already expressed.
- Deciding an IGDB conflict: **Match** sets `igdb.gameId` on the chosen game and parses the IGDB
  game into it; **Skip** creates the IGDB game as a new one.
- A hand-made game linked to IGDB stays hand-made. IGDB then only fills its empty fields, fetches
  images only for an empty cover, screenshot or artwork list, ignores `forceParse`, and never
  changes the slug. Clearing `isCustom` hands the game over to IGDB completely.

### Phase 4 — duplicate warning when adding a game by hand

- `POST /games/add` and the approval of a new-game content request run
  `GameMatcherService.assertNoDuplicates`. Catalogue games that score above the IGDB profile's
  threshold come back as `409` with `{ message, duplicates: [{ _id, name, slug, score }] }`.
- `?force=true` on `/games/add`, or `force: true` in the request decision body, skips the check.
- The admin game form and the request review panel show the list in a confirmation modal
  ("Create anyway"). The AI draft goes through the same form.
- `POST /games/add/duplicates` returns the list without creating anything. The game-adder MCP
  calls it in the preview and again before the real call, and only then uploads images, because a
  refusal after the upload would leave orphan files in the Space. The MCP tool got a `force`
  input.

### Phase 5 — HLTB and RetroAchievements

- **Directions.** A conflict now has a direction:
  - `games` — one source entry against catalogue games (VNDB, IGDB, RA). The decision carries
    `gameId`.
  - `entries` — one catalogue game against source entries (HLTB). `externalId` is the game's
    `_id`, the candidates are HLTB entries, and the decision carries `entryId`.
- **What Skip means belongs to the source.** For VNDB and IGDB it creates a new game; for HLTB and
  RA it leaves the entry unlinked. The tab labels follow the source ("No match" instead of
  "New game").
- **HLTB.** When no entry passes the existing rules but some have a strong title that the year
  does not rule out, `findAmbiguousHltbEntries` offers up to 5 of them as a conflict
  (`competing-candidates`, or `unverified-title` for a single one). The game is still marked
  `hltbNotFoundAt`, so the sync does not retry it every night. **Match** applies the entry through
  `applyHltbEntryById`.
- **RA.** `rankGamesByTitle` ranks the catalogue games on the RA console. When the best two
  different games score closer than `RA_AMBIGUITY_GAP` (0.05), the RA game becomes a conflict
  instead of being linked. `parseRAGames` recomputes every link each run, so it reads the RA
  conflicts first: a resolved one pins its winner, and a pending or skipped one links nothing.
  **Match** also adds the link to the game right away.
- The dead `$ifNull: ["$raIds"]` branch of the RA bulk write was removed. It never matched (the
  field is `retroachievements`), so RA links were always recomputed from scratch, and that stays
  the behaviour on purpose.

## API and contract changes

| Before | After |
|---|---|
| `GET /vndb/candidates` | `GET /conflicts?source=` |
| `GET /vndb/candidates/list` | `GET /conflicts/list?source=&search=&page=&take=` |
| `GET /vndb/candidates/:vnId` | `GET /conflicts/:source/:externalId` |
| `POST /vndb/candidates/:vnId/decision { gameId }` | `POST /conflicts/:source/:externalId/decision { gameId }` or `{ entryId }` |
| socket `/vndb-review`, `candidate:decided`, `candidates:applied` | socket `/conflicts`, `conflict:decided`, `conflicts:applied` (with `source`) |
| — | `POST /games/add?force=true`, `POST /games/add/duplicates` |
| — | `force` in `POST /requests/:id/decision` |

In `@mooncellar/schemas`, `vndb-candidates.schema.ts` became `conflicts.schema.ts` and
`vndb-review-socket.schema.ts` became `conflicts-socket.schema.ts`. `IVndbMatchReason`,
`IVndbScoreBreakdown` and the other `IVndb*` review types were renamed to `IMatchReason`,
`IScoreBreakdown`, `IConflictItem` and so on. `IVndbParseResponse` moved to `vndb.schema.ts`. The
reason enum gained `custom-game`.

## Configuration

| Variable | Where | Meaning |
|---|---|---|
| `IGDB_AUTO_LINK` | `HOST_ENV_API` | `true` lets the nightly IGDB sync link confident matches with parser-created games. Unset: every match goes to Conflicts. Hand-made games always go to Conflicts |

## Migrations

### `vndbcandidates` → `conflicts`

The only data migration. It copies the VNDB review queue into the new collection with
`source: "vndb"`, keeping each record's `_id`, and renames `vnId`/`vnName` to
`externalId`/`externalName`.

```sh
cd apps/api
bun --env-file=.env scripts/migrate-vndb-candidates-to-conflicts.ts          # dry run
bun --env-file=.env scripts/migrate-vndb-candidates-to-conflicts.ts --apply  # writes
```

- **Dry run by default.** It prints the counts and the split by status and decision, and writes
  nothing. The dry run on 2026-09-30 read 11,833 records: 2,953 pending, 3,032 resolved, 5,838
  absent, and 10 finished records with a leftover `decision` field. The worker ignores those
  10, because it only applies `pending` records.
- **Idempotent.** It upserts with `$setOnInsert` on `(source, externalId)`, so a second run only
  adds the records that are missing. It never updates a record that already exists.
- **It creates the two indexes itself** (`source + externalId` unique, `source + status +
  decision`) and connects with `autoIndex: false`, as `apps/api/CLAUDE.md` requires for scripts.
  A local API started against the production database builds the same indexes through Mongoose
  `autoIndex`; that is harmless on an empty collection.
- **Run it right after the deploy, not before.** Until the new API runs, production still reads
  and writes `vndbcandidates`. A decision made there after the copy is not carried over, because
  the migration does not update existing records.
- **Drop `vndbcandidates` by hand**, only after the Conflicts tab shows the VNDB queue on
  production.

No other collection changes. `igdb`, `hltb` and `ra` conflicts start empty and fill from the
parsers.

## Rollout checklist

1. Deploy the API and the web app together — the REST paths and the socket namespace changed on
   both sides.
2. Run the migration with `--apply` right away, then open the Conflicts tab and compare the VNDB
   counts with the dry run.
3. Leave `IGDB_AUTO_LINK` unset for the first week, and read the IGDB conflicts to see how the
   IGDB profile behaves on real data before letting it link on its own.
4. Expect about 570 RA conflicts after the first nightly RA sync. The measurement on 2026-09-30:
   10,021 of 12,268 RA games matched, and 217 / 567 / 789 of them would be ambiguous at a gap of
   0.02 / 0.05 / 0.1. After that one-off batch only new RA games add to the queue.
5. Drop `vndbcandidates`.

## Findings left for later

- **Duplicate games in the catalogue.** In 187 RA matches the two best candidates have the same
  formatted title on the same platform (`Sonic the Hedgehog 3`, `Tetris`, `The Flintstones`, …).
  They will show up as RA conflicts. Merging them is separate work.
- **RA hacks and prototypes link to the original.** RA titles marked `~Hack~`, `~Prototype~` or
  `~Homebrew~` fuzzy-match the base game, so their achievements appear on the original's page.
- **A local API fails production AI drafts.** `GameAiDraftService.onModuleInit` marks every running
  draft as failed on startup, and a local API points at the production database.
