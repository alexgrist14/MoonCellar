# ErrorHandler

A render-nothing client component that calls `initGlobalErrorHandlers` on mount and runs the
cleanup it returns on unmount. It attaches `window` listeners for uncaught errors, unhandled promise rejections and resource load
errors and sends them to `logger` (Grafana).

## When to use

- Mounted once, in `app/ui/Layout`. There is no reason to render it anywhere else.

## API

No props.

## Usage

```tsx
import { ErrorHandler } from "@/src/lib/shared/ui/ErrorHandler";

<ErrorHandler />;
```

## Rules and gotchas

- **Mount it exactly once.** A remount is safe because the listeners are removed on unmount,
  but two mounted instances log every error twice.
- Anything else calling `initGlobalErrorHandlers` must call the function it returns when done.
- It is the only `"use client"` piece needed for this; keep the listener logic in
  `shared/utils/error-handler.utils.ts`, not in the component.
- API failures are not its job — the axios interceptor in `shared/api/agent.api.ts` already
  toasts them.

## Storybook

No story: it renders nothing and only registers global listeners.
