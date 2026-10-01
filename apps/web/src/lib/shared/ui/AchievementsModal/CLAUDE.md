# AchievementsModal

Modal content listing the RetroAchievements awards the signed-in user holds for one game
(mastery, beaten, …). It is built on `RowsModal`: each award becomes a row with its badge, title,
award date, award type and a link to the game on retroachievements.org.

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
- `useCommonStore().systems` — to name the console in the fallback button.

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
- **Only one award per RA game id is shown,** chosen by `AWARD_PRIORITY`
  (`Mastery/Completion` over `Game Beaten` over anything else).
- **Award icons load from `media.retroachievements.org`** unless `imageIcon` is already an
  absolute URL, so the host must stay allowed in `next.config.mjs` `images.remotePatterns`.
- **With no matching award (or no signed-in user) the empty state is a single link button** to
  the game on RetroAchievements, or to a site search by name when the game has no RA id.
- This component carries domain knowledge (game, user awards, stores) although it sits in
  `shared/ui`; do not add more store reads here.

## Storybook

`Shared/AchievementsModal` — `WithAwards`, `NoAwards`, `NoRetroAchievementsId`.
