# Content requests

Signed-in users suggest a new game or character, or a correction to an existing one, from
`/requests`; an admin reviews each request field by field and approval writes it to the catalogue.

## Overview

A request is a document in the `contentrequests` collection. It stores the proposed values
(`payload`) and nothing else: no game, character or image is written until an admin approves it.

| Status      | Set by                              | Meaning                                                                                 |
| ----------- | ----------------------------------- | --------------------------------------------------------------------------------------- |
| `pending`   | `POST /requests`                    | Waiting in the moderation queue. The only status that can change.                       |
| `approved`  | `POST /requests/:id/decision`       | The selected fields were written; `appliedFields` and `resultId` record what and where. |
| `rejected`  | `POST /requests/:id/decision`       | Not applied. `reason` is required and shown to the author.                              |
| `withdrawn` | `DELETE /requests/:id` (the author) | Cancelled by the author before a decision.                                              |

`approved`, `rejected` and `withdrawn` are final: a second decision or withdrawal answers `409`.

### Claim

An approval runs for seconds (IGDB and VNDB parses, image copies), so it first **claims** the
request: one `findOneAndUpdate` filtered on `status: "pending"` and no live claim sets
`claimedAt` and `claimedBy`. The request stays `pending` while it is claimed, so lists, badges
and the 20-pending limit see no new status. Every other transition filters the same way:

- a second approve, a reject or a withdrawal of a claimed request answers `409` "This request
  has already been decided, or another moderator is deciding it";
- the final `approved` write filters on the claim's own `claimedAt`, so an approval whose claim
  was taken over cannot overwrite the other one;
- a failed approval clears the claim again.

A claim older than 15 minutes (`CLAIM_TTL_MS`) counts as abandoned — the API process died
mid-approval — and the next decision takes it over. There is nothing to reset by hand.

## Request kinds and fields

Every request has a `kind` (`game` or `character`) and an `action`:

- `add` — a new entry. The payload needs a `name`, or for a game an `igdbId` or `vndbId`.
- `update` — a correction. `targetId` is required and must point at an existing game or
  character (`404` "Nothing to update found" otherwise). Only the fields the user filled are
  sent; empty fields keep their current value.

Common fields, outside `payload`:

| Field      | Limit                  | Notes                                     |
| ---------- | ---------------------- | ----------------------------------------- |
| `sources`  | up to 10 http(s) links | Where the moderator can check the facts.  |
| `note`     | 2000 characters        | Free text for the moderator.              |
| `targetId` | ObjectId               | Required for `update`, ignored for `add`. |

The payload schemas are `.partial().strict()`: every field is optional, an unknown key is a
`400`, and the payload must have at least one key.

### Game payload

`GameRequestPayloadSchema` in `packages/schemas/src/content-requests.schema.ts`.

| Group          | Fields                                                                                                                                       |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Basics         | `name`, `alternative_names`, `versionTitle`, `type`, `status`, `first_release` (Unix seconds), `summary`, `storyline` (5000 characters each) |
| Releases       | `release_dates` (`date`, `platformId`, optional `region` 1–20), `platformIds`                                                                |
| Classification | `genres`, `modes`, `themes`, `keywords`, `franchises`, `game_engines`, `player_perspectives`, `languages`                                    |
| Companies      | `companies` (name + developer/publisher/porting/supporting flags), shortcut `developer` / `publisher` names                                  |
| Details        | `multiplayer_modes`, `ageRatings`                                                                                                            |
| Links          | `websites`, `videos`, `externalPages` (`uid`, optional `name`, `url`)                                                                        |
| Relations      | `relatedGames` (any relation except `parent_game`, `version_parent` and `editions`, game ids), `parentGameId`                                                                 |
| Images         | `cover`, `screenshots`, `artworks` — links to images on other sites, up to `CONTENT_REQUEST_SCREENSHOTS_MAX` (20) each                       |
| Source ids     | `igdbId` (positive integer), `vndbId` (`v17` form), `hltbId` (digits), `retroachievements` (`gameId` + `consoleId`, up to 10)                |

Every link must be `http` or `https`, at most 2048 characters.

### Character payload

`CharacterRequestPayloadSchema`: `name`, `akas` (up to 20), `gameIds` (up to 60 game ids),
`gender`, `species`, `countryName`, `description` (5000 characters) and `mugShot` (an image link).
A new character always needs a `name`; it has no source ids.

## Submitting

- **Where.** `/requests`, linked from the user menu ("Requests") and from the "Suggest an edit"
  link in a game page's Details block, which opens the form as an update of that game through
  the `kind`, `targetId` and `targetName` query parameters.
- **Who.** Any signed-in user (`AuthGuard("jwt")` + `UserIdGuard`). Guests see "Log in to send a
  request." The page is `noindex`.
- **Form.** Two segmented switches — Game / Character and Add new / Update existing. An update
  first picks its target with a search box (two characters minimum). Platforms are typed by name
  and resolved to ids from the platform list; an unknown name stops the submit with "Unknown
  platform". The form validates with `CreateContentRequestSchema` before sending and shows the
  first issue as a toast; the API validates the same schema again.
- **Limit.** A user can have at most 20 pending requests (`PENDING_REQUESTS_LIMIT`); the
  21st answers `409`. The count runs again after the insert, and a request that pushed the user
  over the limit (two submits at once) is deleted and answered `409`. There is no other rate
  limit.
- **Own list.** "My requests" next to the form pages through the user's requests, 20 at a time
  (`GET /requests/mine?page=`), with their status and the rejection reason, and a Withdraw
  button on pending ones. Withdrawing someone else's request is `403`; withdrawing one a
  moderator is approving right now is `409`.

## Reviewing

Admins review in **Admin → Games → Requests** (`/admin/games?view=requests`) and **Admin →
Characters → Requests**. Both tabs show a badge with the number of pending requests of their
kind (`useRequestsQuery` with `status: "pending"`, `take: 1`, reading `total`).

`RequestsReview` lists the queue with a status filter (pending first, oldest first; other
statuses newest first) and opens `RequestReviewPanel` for the selected request. The panel shows:

- the author's note and source links;
- a diff table with one row per proposed field — **Current** (from `GET /requests/:id`, which
  returns the target's present values as `current`) and **Proposed** — with a checkbox to skip
  the field. Platform and game ids are shown as names. Rows for `screenshots`, `artworks`,
  `relatedGames`, `retroachievements` and a character's `gameIds` are marked "Proposed values
  are added to these"; image rows are marked "Copied to storage on approval";
- for any game request, new or update, "Stop IGDB parsing for this game" (`lockSync`, sets
  `isStopParsing` on the resulting game);
- a reason field (required to reject, optional on approve) and the buttons **Reject** and
  **Approve N of M · copy K image(s)**.

### Possible duplicates

Approving a new game without an IGDB id (or with one that fails to parse) runs
`GameMatcherService.assertNoDuplicates` on the applied `name`, `alternative_names`, `type`,
`first_release`, `companies` (with `developer` / `publisher` folded in), `platformIds` and
`summary`. A likely match answers `409` with the candidates; the panel shows them through
`confirmPossibleDuplicates`, and confirming resends the decision with `force: true`. A game
created by parsing an IGDB id skips the check, like every explicit parse by id.

Approving a new character checks its `name` and `akas` against the `name` and `akas` of existing
characters, case-insensitively and whole-string. When the request links games, only characters
of those games count. A match answers the same `409` shape (`POSSIBLE_DUPLICATES_MESSAGE`,
`duplicates` with the character's slug and `score: 1`), the panel lists the names without links
(characters have no page), and `force: true` creates the character anyway.

The duplicate `409` releases the claim, so the forced resend can claim the request again.

After a successful approval the panel calls `revalidateGamePage` for the affected game pages (the
target and the result for a game; the linked games for a character), and shows any failed images
and warnings as error toasts.

## What approval writes

The admin's `fields` are intersected with the payload keys; at least one must remain (`400`
"Pick at least one field to apply"), and an `add` must keep `name`, `igdbId` or `vndbId`.

### Games

1. **Find or create the game.** `update` uses `targetId` (`404` if it was deleted since). An
   `add` with `igdbId` parses the game from IGDB with images. Otherwise a game is created from
   `name` as a hand-made game (`isCustom: true`, `type` main game, unique slug) after the
   duplicate check, and its URL is sent to IndexNow.
2. **Link source ids.**
   - `igdbId` is linked and parsed unless the game is a VNDB game or another game already owns
     that id — both become warnings. An `add` whose IGDB parse already failed in step 1 is not
     parsed a second time: the game is created from the name, the one warning stays, and the id
     is not stored.
   - `vndbId` is linked and parsed through `VndbService.parseGame` unless another game owns it.
     A failed parse keeps the id and returns a warning.
   - `hltbId` runs `HltbService.syncGame`; a failure is a warning.
3. **Write the remaining fields** with one `$set`:
   - Plain fields replace the stored value; `name` also updates `nameNormalized` (the slug never
     changes).
   - `platformIds` and `release_dates` keep only platforms that exist; release dates get
     `human`, `month` and `year`, and region 8 (worldwide) when none was given.
   - `developer` / `publisher` set the flag on the company of that name, or add the company.
   - `relatedGames` is merged into the existing relations (existing games only, never the game
     itself); `parentGameId` sets `parent_game`.
   - `retroachievements`, `screenshots` and `artworks` are appended; `cover` replaces.

### Characters

`update` sets the selected fields on the character; `add` creates it with a unique slug after
the duplicate check. `gameIds` keeps only existing games. On an `update` they are **added** to
the character's list with `$addToSet` — the request form starts with an empty game list, so a
replace would have unlinked every game the author did not retype.

### Images

Every image link (`cover`, `screenshots`, `artworks`, `mugShot`) goes through
`FileService.uploadRemoteImage` into the matching S3 folder under `<entityId>/<new id>`. The
download refuses non-http(s) links, private and loopback addresses on every redirect hop,
non-image content types and bodies over 15 MB, and never sends the stored site cookies. A link
that fails is skipped, logged and returned in `failedImages`; the approval still succeeds.

The request is then marked `approved` with `appliedFields`, `resultId`, `decidedAt`,
`decidedBy` and the optional `reason`, and the claim is cleared.

### When approval fails

Anything that throws after the claim — a duplicate `409`, a database error, a lost claim — rolls
the approval back before the error reaches the admin:

- a game or character **created** by this approval (a hand-made game, a game newly parsed from
  IGDB, a new character) is deleted, together with every Space image its document references
  and every image this approval uploaded;
- on an `update`, the entry itself is written in one final `updateOne`; images uploaded before
  a failure that came earlier are deleted, images already written into the entry are kept;
- the claim is cleared, so the request is `pending` again and a retry does not run into a
  duplicate `409` against a half-written entry.

Not rolled back: what the IGDB, VNDB and HLTB links of an existing game wrote on their own
(`igdb.gameId`, `vndb.vnId`, their parsed fields), and characters an IGDB parse created for a
deleted game. A failed cleanup is logged and never hides the original error.

## API endpoints

All under `/requests` (`ContentRequestsController`), cookie session auth.

| Method   | Path                     | Auth  | Purpose                                                                                                                  |
| -------- | ------------------------ | ----- | ------------------------------------------------------------------------------------------------------------------------ |
| `POST`   | `/requests`              | User  | Create a request (`CreateContentRequestSchema`). Returns the request.                                                    |
| `GET`    | `/requests/mine`         | User  | The user's requests, newest first: `page`, `take` (1–100, default 20). Returns `results` and `total`.                    |
| `DELETE` | `/requests/:id`          | User  | Withdraw an own pending, unclaimed request.                                                                              |
| `GET`    | `/requests`              | Admin | Queue: `status`, `kind`, `page`, `take` (1–100, default 20). Returns `results` and `total`.                              |
| `GET`    | `/requests/:id`          | Admin | One request plus `current`, the target's present values for the proposed keys.                                           |
| `POST`   | `/requests/:id/decision` | Admin | `decision` (`approve`/`reject`), `fields`, `reason`, `lockSync`, `force`. Returns `request`, `failedImages`, `warnings`. |

Responses are decorated with `userName`, `targetName`/`targetSlug` and `resultSlug`.

## Rules

- User-supplied image links are fetched only through `FileService.uploadRemoteImage`, and never
  with stored site cookies — see "Stored site cookies" and "An image URL that came from a user"
  in [`apps/api/CLAUDE.md`](../apps/api/CLAUDE.md).
- Every status change filters on `status: "pending"` and no live claim, and answers `409` when
  nothing matched — never read the status and write it in a second step — see "A content request
  is decided only through its claim" in [`apps/api/CLAUDE.md`](../apps/api/CLAUDE.md).
- The duplicate check and `force` follow "Adding a game by hand checks the catalogue first" in
  the same file; parse-by-id skipping the matcher is "The nightly IGDB sync checks a new IGDB game".
- A character linked by an approved request is read through `character.gameIds`, which the IGDB
  and VNDB syncs leave alone — "A game's characters are read from `character.gameIds`".
- An IGDB link on a hand-made game only fills its empty fields — "IGDB only fills the empty
  fields of a hand-made game".
- Every non-submit button in the form needs `type="button"` — [`RequestsPage/CLAUDE.md`](../apps/web/src/lib/pages/RequestsPage/CLAUDE.md).
- The admin sub-view is switched with `setAdminQuery`, and approval must revalidate the game page
  before refreshing — [`pages/Admin/CLAUDE.md`](../apps/web/src/lib/pages/Admin/CLAUDE.md).

## Files

| Piece                    | Path                                                                                                                  |
| ------------------------ | --------------------------------------------------------------------------------------------------------------------- |
| Schemas and limits       | `packages/schemas/src/content-requests.schema.ts` (+ `.spec.ts`)                                                      |
| Controller               | `apps/api/src/module/games/controllers/content-requests.controller.ts`                                                |
| Service                  | `apps/api/src/module/games/services/content-requests.service.ts`                                                      |
| Mongoose model           | `apps/api/src/module/games/schemas/content-request.schema.ts`                                                         |
| DTOs                     | `apps/api/src/shared/zod/dto/content-requests.dto.ts`                                                                 |
| Remote image download    | `apps/api/src/shared/remote-image.ts`                                                                                 |
| Route                    | `apps/web/src/app/requests/page.tsx`                                                                                  |
| Page                     | `apps/web/src/lib/pages/RequestsPage`                                                                                 |
| Form and its fields      | `apps/web/src/lib/features/requests` (`RequestForm`, `GameRequestFields`, `useEntitySearch`, `game-request.utils.ts`) |
| User's list              | `apps/web/src/lib/widgets/requests/UserRequests`                                                                      |
| Entity (queries, status) | `apps/web/src/lib/entities/request`                                                                                   |
| HTTP client              | `apps/web/src/lib/shared/api/content-requests.api.ts`                                                                 |
| Admin review             | `apps/web/src/lib/widgets/admin/RequestsReview`                                                                       |
| Admin tabs and badges    | `apps/web/src/lib/pages/Admin/Admin.tsx`                                                                              |
