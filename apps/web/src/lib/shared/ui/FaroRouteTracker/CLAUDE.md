# FaroRouteTracker

A `"use client"` component that renders nothing and pushes a Grafana Faro `page_view` event with
the current `pathname` every time the route changes.

## When to use

- Mounted once in the root `app/layout.tsx`. There is no reason to mount it anywhere else; a
  second instance doubles every page view.

## API

No props.

## Usage

```tsx
import { FaroRouteTracker } from "@/src/lib/shared/ui/FaroRouteTracker";

<body>
  <FaroRouteTracker />
  {children}
</body>;
```

## Rules and gotchas

- It calls `faro.api?.pushEvent`, so it is a silent no-op until Faro has been initialised.
  Missing page views mean the Faro setup did not run, not that this component is broken.
- It tracks `pathname` only; query-string changes (filters, pagination) are not page views.

## Storybook

No story: renders nothing, it only sends analytics events.
