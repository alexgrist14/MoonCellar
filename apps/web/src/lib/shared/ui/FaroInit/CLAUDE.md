# FaroInit

A render-nothing client component that starts Grafana Faro (frontend logs, errors and web
vitals) once per page load by calling `initFaro()` from `shared/utils/faro.utils`.

## When to use

- It is mounted once, in the root layout (`src/app/layout.tsx`). Do not mount it anywhere
  else.
- To change what is collected or where it is sent, edit `initFaro`, not this component.

## API

No props. Renders `null`.

## Usage

```tsx
import { FaroInit } from "@/src/lib/shared/ui/FaroInit";

<body>
  {children}
  <FaroInit />
</body>;
```

## Rules and gotchas

- It is one of the few shared components with `"use client"`, which is what lets the root
  layout (a server component) render it directly.
- Initialisation runs in `useEffect`, so it never runs on the server; `initFaro` also guards
  `typeof window` and a module-level `initialized` flag, so remounts do not start a second
  instance.
- Data goes to `${API_URL}/faro`; the app name and version come from
  `NEXT_PUBLIC_FARO_APP_NAME` and `NEXT_PUBLIC_APP_VERSION`.

## Storybook

No story: it renders nothing and would send telemetry to the API from Storybook.
