# AvatarSettings

The avatar picker on the settings screen: shows the signed-in user's avatar (or a picked file),
a camera overlay on hover, and a hidden file input. It does not upload anything — it hands the
picked `File` back to the parent, which sends it on Save.

## When to use

- Only for editing the current user's avatar (`features/user/ui/Settings`).
- Not for showing someone's avatar — it reads `useAuthStore().profile`, always the viewer.

## API

| Prop            | Type                                          | Default | Purpose                                                             |
| --------------- | --------------------------------------------- | ------- | ------------------------------------------------------------------- |
| `tempAvatar`    | `File`                                        | —       | The picked, not yet saved file; shown instead of the stored avatar. |
| `setTempAvatar` | `Dispatch<SetStateAction<File \| undefined>>` | —       | Receives the picked file, or `undefined` when it is over 2 MB.      |

## Usage

```tsx
import { AvatarSettings } from "@/src/lib/shared/ui/AvatarSettings";

const [tempAvatar, setTempAvatar] = useState<File>();

<AvatarSettings tempAvatar={tempAvatar} setTempAvatar={setTempAvatar} />;
```

## Rules and gotchas

- **It reads and writes `useAuthStore`.** Without a `profile` it renders only a skeleton; picking
  a file also clears `profile.avatar` in the store so the preview wins. Stories must seed the
  store (`useAuthStore.setState({ profile })`).
- The preview is an object URL created per picked file and revoked when the file changes or the
  component unmounts; cancelling the file dialog keeps the current pick.
- Files over 2 MB (2048 KB) are rejected client-side with an inline message; the API enforces its own
  limit as well.
- Accepted types are `jpeg`, `png`, `jpg`, `webp` via the input's `accept`.
- No `"use client"` directive: import it from a client component, never from a route under
  `src/app/`.

## Storybook

`Shared/AvatarSettings`: `Default`, `WithAvatar`, `Loading`.
