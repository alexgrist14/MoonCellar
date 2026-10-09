# Skeleton

A pulsing placeholder in `--color-bg-tertiary`, the site's one loading look (the same
`skeletonPulse` as `Dropdown`'s and `AvatarSettings`' placeholders and `ListCard`'s mosaic). It
has no size of its own: the consumer gives it the size of the thing it stands in for, so the
layout does not move when the data arrives.

## When to use

- Every place where content is still loading: a grid of cards, a feed, a table, a panel, an
  image, a field. Build the placeholder out of `Skeleton`s shaped like the real content.
- When a component is shown loading in more than one place, give it its own skeleton next to it,
  built on the component's own classes, so the two keep the same size: `GameCardSkeleton`
  (`widgets/game/GameCard`, used by `GamesCards isLoading` and `GamesList isLoading`),
  `ListCardSkeleton` (`shared/ui/ListCard`), `NotificationItemSkeleton`, `ListCheckRowSkeleton`,
  the community `EntrySkeleton`, `ActivityTimelineSkeleton`, `UserNavigationSkeleton`,
  `UserInfoSkeleton`, `StatTile isLoading`, `SavedList isLoading`, `PageSkeleton` for a whole
  route and `UserProfileSkeleton` for the profile.
- **Not for an action in progress** over content already on screen (saving, deleting, a
  refresh behind filters) — that stays `Loader` or `Button`'s `isLoading`.

## API

| Prop          | Type                            | Default         | Purpose                                                                                               |
| ------------- | ------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------- |
| `shape`       | `"block" \| "text" \| "circle"` | `"block"`       | `block`: `--radius-x2`. `text`: a `1em` bar centred in one line box. `circle`: square, fully rounded. |
| `width`       | `string`                        | `100%`          | Any CSS length or token (`"var(--community-avatar-size)"`, `"60%"`).                                  |
| `height`      | `string`                        | —               | Height of a block; `text` is `1em` and `circle` follows the width unless this is set.                 |
| `aspectRatio` | `string`                        | —               | For covers and images: `"var(--cover-ratio)"`, `"16 / 9"`.                                            |
| `radius`      | `string`                        | per `shape`     | The radius of what it replaces (`"var(--radius-x4)"` for a game card, `"inherit"`).                   |
| `count`       | `number`                        | `1`             | Renders that many in a column. With `shape="text"` the last line is 60% wide.                         |
| `gap`         | `string`                        | `var(--gap-x2)` | Gap between the repeated items.                                                                       |
| `className`   | `string`                        | —               | Placement only (position, grid area, flex); on the group when `count > 1`.                            |
| `style`       | `CSSProperties`                 | —               | Inline style, on the group when `count > 1`.                                                          |

## Usage

```tsx
import { Skeleton } from "@/src/lib/shared/ui/Skeleton";

<div className={styles.entry} role="status" aria-label="Loading">
  <Skeleton shape="circle" width="var(--community-avatar-size)" />
  <div className={styles.entry__main}>
    <Skeleton shape="text" width="30%" />
    <Skeleton shape="text" count={2} />
  </div>
</div>;

<Skeleton aspectRatio="var(--cover-ratio)" radius="var(--radius-x4)" />;

<Skeleton
  count={3}
  height="var(--field-control-height)"
  radius="var(--radius-control)"
/>;
```

## Rules and gotchas

- **It is `aria-hidden`; the container announces the loading.** Put `role="status"` and
  `aria-label="Loading"` on the element that wraps the placeholder (`GamesCards`,
  `ListCardsGrid isLoading`, `SavedList`, `PageSkeleton` do it themselves), not on each
  `Skeleton`, or a screen reader says "Loading" once per bar.
- **A `text` bar takes the height of a line of the text it replaces.** It is `1em` tall with
  `margin-block: (1lh - 1em) / 2`, so inside an element with that text's font size and line
  height it occupies exactly one line. Wrap it in the real text's class (`.tile__value`,
  `.hero__name`, `SectionTitle`) rather than passing a height; a row whose real content is a link
  styled as `Button` (`line-height: 1`) needs `line-height: 1` on the skeleton's row too.
- **Its width is `:where()`, so a consumer class can size it,** but a `width` passed as a prop is
  inline and wins over any class.
- **A `text` line inside a shrink-to-fit parent collapses to zero width.** `100%` of a flex item
  that has no other content is `0`; give that parent `flex: 1` or a grid column
  (`NotificationItemSkeleton` does exactly that).
- **Size it with tokens, never raw pixels.** The placeholder must change with the component it
  imitates; a new size gets a `:root` variable like any other.
- **Gate it like a loader: `isLoading` held by `useMinimumLoading`, never `isPending` or
  `isFetching`.** The rules in `apps/web/CLAUDE.md` → Data fetching apply unchanged.
- The pulse stops under `prefers-reduced-motion`.

## Storybook

`Shared/Skeleton`: `Block`, `Text`, `Paragraph`, `Circle`, `GameCover`, `FieldRows`, `Composed`.
