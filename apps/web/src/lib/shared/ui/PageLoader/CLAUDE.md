# PageLoader

A full-viewport-height block with the `moon` `Loader` in the middle. It is the loading state of a
whole page.

## When to use

- As the `Suspense` fallback of a route or a route `layout` (`app/games/page.tsx`,
  `app/user/[name]/(profile)/layout.tsx`, the admin game pages).
- Inside a section or a panel use `Loader` directly; `PageLoader` is `100dvh` tall and pushes
  everything below it off the screen.

## API

No props.

## Usage

```tsx
import { Suspense } from "react";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";

<Suspense fallback={<PageLoader />}>
  <GamesPage initialParams={params} initialData={initialData} />
</Suspense>;
```

## Rules and gotchas

- It has no hooks, so a route file under `src/app/` can import it directly.
- Do not place a `Suspense` boundary with this fallback above a page component that can call
  `notFound()`: the throw is caught below the flushed shell and the response stays a soft 200.
- The loader colour is `var(--color-accent)`; `react-spinners` writes it into inline styles, so
  any palette variable works there — never a hex.

## Storybook

`Shared/PageLoader`: Default.
