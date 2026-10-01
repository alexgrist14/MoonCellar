# GameButtons

A full-width column of external link buttons for one game: direct links to its Steam, IGDB,
HowLongToBeat and VNDB pages when the game has those ids, plus searches on YouTube,
RetroAchievements, HowLongToBeat and VNDB by name. Every link opens in a new tab. It is the
content of the "External links" popover in `GameControls`.

## When to use

- The "open this game elsewhere" menu on a game card or game page.
- Not for the store and website links shown on the game page — those are `GameExternalPages`
  and `GameLinksBlock` in `entities/game`.
- Not as a generic link list — use `ButtonGroup` with your own items.

## API

| Prop   | Type            | Default | Purpose                                                |
| ------ | --------------- | ------- | ------------------------------------------------------ |
| `game` | `IGameResponse` | —       | Reads `name`, `externalPages`, `igdb`, `hltb`, `vndb`. |

## Usage

```tsx
import { GameButtons } from "@/src/lib/shared/ui/GameButtons";
import { Popover } from "@/src/lib/shared/ui/Popover";

<Popover
  anchorRef={linksRef}
  isOpen={isLinksOpen}
  onClose={close}
  align="end"
  width="300px"
>
  <GameButtons game={game} />
</Popover>;
```

## Rules and gotchas

- Its root stops click propagation. That is what lets the links work inside `Popover`, whose
  root calls `preventDefault` on every click, and inside a `GameCard` link that would otherwise
  navigate to the game; do not remove it.
- "Open in Steam" is shown only for an `externalPages` entry named exactly `"Steam"`; "Open in
  IGDB" only with `igdb.gameId`, HLTB only with `hltb.hltbId`, VNDB only with `vndb.vnId`. The
  four search links are always shown.
- "Open in IGDB" uses the stored `igdb.url`, and falls back to an IGDB search by name; never
  build it from the MoonCellar `slug`, which can differ from IGDB's.
- Every search URL takes `encodeURIComponent(game.name)`; an unencoded `&` or `#` in a name
  truncates the query.
- Being in `shared` while taking `IGameResponse` is an FSD exception: the component is
  domain-aware, so new game-specific actions belong in `entities/game` or a feature instead.

## Storybook

`Shared/GameButtons` — `AllSources`, `SearchOnly`.
