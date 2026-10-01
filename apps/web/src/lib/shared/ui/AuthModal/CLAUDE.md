# AuthModal

The sign-in / sign-up form shown in a modal. It switches between registration and login,
validates with `createAuthSchema` (zod) and calls `login`/`signup` from the shared `useAuth`
hook, which stores the profile and closes the modal on success.

## When to use

- Open it with `openAuthModal()` whenever a guest triggers something that needs an
  account (the header avatar, `useRequireAuth` in the game community).
- Do not embed it inline in a page: its close button calls `modal.close()`, which only makes
  sense inside `ModalsConnector`.
- Do not build a second login form; extend this one.

## API

`AuthModal` takes no props.

| Export             | Type                                 | Purpose                                                                                                                       |
| ------------------ | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `AuthModal`        | `FC`                                 | The form itself. Opens in sign-up mode.                                                                                       |
| `createAuthSchema` | `(isRegister: boolean) => ZodObject` | Login schema, or the stricter sign-up schema (username 3–15 `[a-zA-Z0-9_]`, password 6–100). Not re-exported from the barrel. |
| `AuthSchema`       | type                                 | Inferred form values (`userName?`, `email`, `password`).                                                                      |

## Usage

```tsx
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import { modal } from "@/src/lib/shared/ui/Modal";

<button type="button" onClick={() => openAuthModal()}>
  Sign in
</button>;
```

## Rules and gotchas

- Requires `ModalsConnector` (the `#modals` root) to be mounted; it is in `Layout`. Without it
  `modal.open` does nothing.
- Success closes every open modal: `useAuth().authUpdate` calls `modal.close()` without an id,
  so anything stacked beneath the auth modal goes too.
- The schema is chosen per submit from `isRegister`; switching modes calls `reset()` and
  clears errors, so typed values are lost on purpose.
- `onSubmit` copies every `FormData` entry into the form with `setValue` before validating,
  so browser autofill that bypasses React's change events is still submitted.
- The submit button's pending state is `Button isLoading`, driven through `useMinimumLoading`
  so it stays visible for a minimum time even on a fast response. Do not bring back a `Loader`
  plus a hidden label inside the button.
- Every control is a `Button`: the mode switch is a `type="button"` transparent compact button
  (it must not submit the form), and the close control is an icon-only transparent button with
  the "Close" tooltip that calls `modal.close(AUTH_MODAL_ID)`.
- A failed login or sign-up shows the API's `message` (or a fallback) under the inputs. The
  agent's response interceptor toasts the same error as well; the inline line exists so the
  message stays next to the form.
- The username field is unmounted in login mode; the login schema keeps `userName` optional
  for that reason.

## Storybook

`Shared/AuthModal`: `Inline`, `InModal`. Neither story submits — submitting would hit the
auth API.
