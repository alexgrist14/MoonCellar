# GauntletPage

The game picker: a wheel that spins over either the filtered catalogue (Gauntlet mode) or the
viewer's crowned shortlist (Royal mode, knock-out). Public; history and royal games persist per
viewer.

## Routes

- `/gauntlet` — `src/app/gauntlet/page.tsx`.
- Static metadata: title `Gauntlet`, canonical `/gauntlet`, own keywords. The route renders
  `BreadcrumbList` JSON-LD.
- No server data fetch. The route renders the JSON-LD and `<GauntletPage />` from the barrel and
  nothing else; the page owns its layout, its `Suspense` (with `PageLoader`, because the panel
  and the filters read the query string) and its styles.

## Data

- `useWheelStore` — the current `winner` (drives `BGImage`) and the royal round state.
- `useStatesStore().isRoyal` — which mode is on.
- Filters live in the URL (Gauntlet mode only) and are written by `Filters` through
  `pushState`. `GauntletModePanel` counts matching games with `useGamesQuery({ …, take: 1 })`.
- Royal games are read and written only through `useRoyalGames` (guest store or the `/royal`
  socket for a signed-in user).

## Composition

Everything sits in `.wrapper` inside one `Suspense`:

1. `widgets/gauntlet/GauntletModePanel` — breadcrumbs, `SectionTitle as="h1"` "Gauntlet", mode
   copy and switch (`ModeCards`, built on the shared `ChoiceCards`), match counts,
   `AppliedGameFilters`.

Then, in `.page`:

2. Left `ExpandMenu` "Filters" → `Filters isGauntlet` — hidden in Royal mode.
3. Right `ExpandMenu` "Lists" → `widgets/main/ConsolesList` (Gauntlet games, Royal list, History tabs).
4. `BGImage` of the current winner.
5. `widgets/wheel/WheelContainer` — the wheel.

## Rules and gotchas

- **Read and change royal games only through `useRoyalGames`.** Reading
  `useGamesStore().royalGames` directly shows a signed-in user the leftover guest list, and
  writing to it changes nothing on the account.
- **`socket.io-client` for `/royal` stays a dynamic `import()` on its own `Manager`.** A static
  import ships it to every guest, and sharing the `/comments` manager sends no credentials.
- **The `<h1>` and breadcrumbs live in `GauntletModePanel`.** Removing the panel from the page
  drops them from the HTML.
- **The route imports the page through its barrel and nothing else from it.** A route that
  imports the page's `.module.scss` or composes widgets itself breaks the FSD rule that a route
  only loads data and picks a page.
- The two `ExpandMenu`s are told apart by `position` (`left`/`right`), which `ExpandMenu` uses
  as the element id; never give both the same id.
- **A full-height wheel panel needs `minHeight: 0` in `templateStyle`.** `WheelContainer`
  carries it; without it the panel grows past a short container.
- Royal mode hides the Filters menu on purpose: the crowned list is the filter.
