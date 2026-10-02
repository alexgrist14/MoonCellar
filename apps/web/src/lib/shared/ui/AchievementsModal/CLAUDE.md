# AchievementsModal

Modal content listing every RetroAchievements game linked to one game (one per console) and the
award the signed-in user holds for each (mastery, beaten, …). It is built on `RowsModal`: every
`game.retroachievements` entry becomes a row with a link to that RA game, named after its console.
A row with an award is filled with its badge, title, award date and award type; a row without one
shows the game name only.

## When to use

- Open it from a game card's achievement badge: `modal.open(<AchievementsModal game={game} />)`.
- Do not use it as a generic list modal; for a new "title plus rows" modal use `RowsModal`
  directly (and ask the user first, see `RowsModal/CLAUDE.md`).

## API

| Prop   | Type            | Default | Purpose                                                      |
| ------ | --------------- | ------- | ------------------------------------------------------------ |
| `game` | `IGameResponse` | —       | The game whose `retroachievements` ids are matched to awards |

Data it reads on its own:

- `useAuthStore().profile.raAwards` — the viewer's awards.
- `useCommonStore().systems` — to name the console on a row without an award.

## Usage

```tsx
import { AchievementsModal } from "@/src/lib/shared/ui/AchievementsModal";
import { modal } from "@/src/lib/shared/ui/Modal";

modal.open(<AchievementsModal game={game} />, { id: "game-achievements" });
```

## Rules and gotchas

- **Open it through `modal.open`, not by rendering it inline.** It is a bare `Box` panel with no
  overlay or close handling of its own; `ModalsConnector` supplies both.
- **Props are frozen at open time.** `modal.open` stores the JSX, so a game updated afterwards
  does not reach the open modal; reopen it instead.
- **It is wider than a plain `RowsModal` (420–520px) with `--gap-x6` between the badge and the
  text,** set through the `RowsModal` variables in `.list`.
- **Every linked RA game gets a row, awarded or not;** never filter rows down to awards, or a
  console the user has not played vanishes from the modal.
- **Only one award per RA game id is shown,** chosen by `AWARD_PRIORITY`
  (`Mastery/Completion` over `Game Beaten` over anything else).
- **Award icons load from `media.retroachievements.org`** unless `imageIcon` is already an
  absolute URL, so the host must stay allowed in `next.config.mjs` `images.remotePatterns`.
- **The empty state appears only when the game has no RA id:** a single button searching
  RetroAchievements for the game name.
- This component carries domain knowledge (game, user awards, stores) although it sits in
  `shared/ui`; do not add more store reads here.

## Storybook

`Shared/AchievementsModal` — `WithAwards`, `AwardOnOneOfSeveralConsoles`, `NoAwards`,
`NoRetroAchievementsId`.
