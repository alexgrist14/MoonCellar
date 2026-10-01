# StatusBadge

A small pill tinted by a playthrough status (`completed`, `mastered`, `playing`, `played`,
`wishlist`, `backlog`, `dropped`), plus the companion `StatusDetails`, a muted
`·`-separated line of extra facts. Used by `AuthorStatus`, `GamePlaysInfo` and
`GameFriendsStatus`.

## When to use

- Showing a game's play status next to a user or a playthrough.
- Not for arbitrary tags or counts — those are plain text or `Button`s.

## API

`StatusBadge`

| Prop        | Type        | Default | Purpose                                                                      |
| ----------- | ----------- | ------- | ---------------------------------------------------------------------------- |
| `status`    | `string`    | —       | Status key; trimmed and lower-cased, picks the colour and the default label. |
| `children`  | `ReactNode` | —       | Custom label instead of the capitalised status.                              |
| `className` | `string`    | —       | Extra class.                                                                 |

`StatusDetails`

| Prop        | Type          | Default | Purpose                                          |
| ----------- | ------------- | ------- | ------------------------------------------------ |
| `items`     | `ReactNode[]` | —       | Parts to join with `·`; falsy parts are dropped. |
| `className` | `string`      | —       | Extra class.                                     |

## Usage

```tsx
import { StatusBadge, StatusDetails } from "@/src/lib/shared/ui/StatusBadge";

<StatusBadge status={category} />;
{
  isMastered && <StatusBadge status="mastered" />;
}
<StatusDetails items={[platform, !!time && `${time} h`]} />;
```

## Rules and gotchas

- **The colour comes from `--game-<status>-color`, generated from the `$statuses` list in the
  module.** A new status needs both an entry there and the variable; an unknown key renders a
  gray pill.
- `StatusDetails` parts can be elements (`<ScoreValue size="inline" />`); they inherit the
  line's muted 12px text, so do not restyle them from the consumer.
- `StatusDetails` returns `null` when every item is falsy, so it can be rendered
  unconditionally.

## Storybook

`Shared/StatusBadge`: `Default`, `AllStatuses`, `UnknownStatus`, `CustomLabel`, `WithDetails`,
`WithNodeDetails`.
