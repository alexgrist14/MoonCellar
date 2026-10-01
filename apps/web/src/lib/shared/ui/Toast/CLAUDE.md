# Toast

Transient notifications at the bottom centre of the screen. Code calls `toast.success(...)` or
`toast.error(...)` from `shared/utils/toast.utils`; `ToastConnector`, mounted once in `Layout`,
listens to those events and renders each `Toast` with a progress bar that empties over 3 seconds
(`TOAST_SETTINGS.DISPLAY_TIME`). Hovering pauses the countdown, clicking dismisses the toast, and
a repeated title collapses into one toast with a counter ("Saved 2x").

## When to use

- Confirming a user action ("Added to list") or reporting a failure the user caused.
- Not for API errors — the `agent` response interceptor already toasts every failed request;
  a second toast from the caller duplicates it.
- Not for anything the user must act on or read at length — use `modal.open` or `drawer.open`.
- Not for a validation message — show it next to the field (`Input`'s `error`, `Errors`).

## API

`toast` (`@/src/lib/shared/utils/toast.utils`): `toast.success(props)` and `toast.error(props)`,
with these props:

| Prop          | Type        | Default | Purpose                                                        |
| ------------- | ----------- | ------- | -------------------------------------------------------------- |
| `title`       | `string`    | —       | Heading (red for errors); also the key for collapsing repeats. |
| `description` | `string`    | —       | Body text.                                                     |
| `content`     | `ReactNode` | —       | Replaces title and description entirely.                       |
| `className`   | `string`    | —       | Extra class on the toast.                                      |

Exported from the barrel: `ToastConnector` (no props). `Toast` itself is internal; its `toasters`/`setToasters`/`toasterId` props are
wiring from the connector.

## Usage

```tsx
import { toast } from "@/src/lib/shared/utils/toast.utils";

toast.success({
  title: "Added to list",
  description: "Hollow Knight → Favorites",
});

toast.error({
  title: "Upload failed",
  description: "The image is larger than 5 MB",
});
```

## Rules and gotchas

- `ToastConnector` must be mounted exactly once; it owns the `#toast` element every `Toast`
  portals into. Without it `toast.*` emits into nothing; with two, the second's toasts portal
  into the first `#toast` and appear twice.
- Only toasts with a `title` collapse into a counter; title-less toasts always stack.
- Toast ids come from a module-level counter, so toasts emitted in the same tick still get
  distinct React keys.
- `toast.*` works from any module (hooks, socket handlers, interceptors) because it only emits an
  event; it does not need React context.
- The connector is a `role="status"` / `aria-live="polite"` region, so screen readers announce
  toasts without interrupting; still never make a toast the only place important information
  appears — it disappears after 3 seconds.
- There is no per-type toast class: `type` only colours the title (`toast__title_error`).

## Storybook

`Shared/Toast` — `Success`, `Error`, `Repeated`, `LongText`, `CustomContent`.
