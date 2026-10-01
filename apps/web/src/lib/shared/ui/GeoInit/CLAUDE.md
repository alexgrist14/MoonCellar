# GeoInit

A `"use client"` component that renders nothing. On mount it fetches `/api/geo` and writes the
visitor's `country` and `blockedCountry` into `useGeoStore` (which also flips `resolved`), which decides whether adult media
and the "Show adult content" setting are shown.

## When to use

- Mounted once in the root `app/layout.tsx`. Read the result from `useGeoStore`, never by
  fetching `/api/geo` again.

## API

No props.

## Usage

```tsx
import { GeoInit } from "@/src/lib/shared/ui/GeoInit";

<body>
  <GeoInit />
  {children}
</body>;
```

## Rules and gotchas

- It fails closed: a failed request stores `blockedCountry: true`. Keep it that way, because the
  blocked region (`GEO_BLOCK_COUNTRIES`) must stay filtered even when the lookup breaks.
- An unknown country counts as blocked everywhere except `next dev`; a production build without
  `GeoLite2-Country.mmdb` hides adult content from everyone.
- Until the request settles the store holds `blockedCountry: false` with `resolved: false`.
  Anything gated on geo must check `resolved` first (as `Settings` does), or it shows adult
  content for the moment before the answer arrives.

## Storybook

No story: renders nothing, it only initialises the geo store.
