# Avatar

Round user avatar: the user's uploaded image through `next/image`, or a `SvgProfile` placeholder
when there is none. By default it is wrapped in a `Tooltip` showing the user name.

## When to use

- Any place that shows a user's picture: header menu, people lists, friends on a game page.
- Not for editing the picture — that is `AvatarSettings`.

## API

| Prop               | Type                                           | Default | Purpose                                                        |
| ------------------ | ---------------------------------------------- | ------- | -------------------------------------------------------------- |
| `user`             | `Pick<IUser, "_id" \| "userName" \| "avatar">` | —       | Whose avatar; missing `avatar` shows the placeholder           |
| `isWithoutTooltip` | `boolean`                                      | `false` | Skip the user-name tooltip (when the name is shown next to it) |
| `isWithoutHover`   | `boolean`                                      | `false` | Disable the image hover effect                                 |
| `priority`         | `boolean`                                      | `false` | Passed to `next/image` for above-the-fold avatars              |

## Usage

```tsx
import { Avatar } from "@/src/lib/shared/ui/Avatar";

<Avatar user={{ _id: user._id, userName: user.userName, avatar: user.avatar }} />

<Avatar user={profile} isWithoutTooltip isWithoutHover priority />
```

## Rules and gotchas

- **Pass `isWithoutTooltip` when the user name is already visible beside the avatar.** Otherwise
  the same name is announced twice and the tooltip covers neighbouring rows in dense lists.
- The image `alt` is `"<userName>'s avatar"` (`"User avatar"` without a name); the placeholder
  icon has no text, so a link whose only content is a placeholder avatar still needs its own
  `aria-label`.
- **Size comes from the container**, not from the 90×90 `next/image` intrinsic size; control it
  through the parent's CSS.
- Avatar URLs are remote; their hosts must be allowed in `next.config.mjs` `images.remotePatterns`.

## Storybook

`Shared/Avatar` — `WithImage`, `Placeholder`, `WithoutTooltip`, `WithoutHover`.
