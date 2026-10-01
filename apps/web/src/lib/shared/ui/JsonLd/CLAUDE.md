# JsonLd

Renders a `<script type="application/ld+json">` with structured data for search engines.

## When to use

- In route files under `src/app/` (and the root layout) to emit schema.org data: website,
  breadcrumbs, item lists, video games.
- Build the payload with the helpers in `shared/utils/json-ld.utils` (`getWebSiteJsonLd`,
  `getBreadcrumbJsonLd`, `getItemListJsonLd`, `getVideoGameJsonLd`) rather than writing objects inline.
- Not for any other inline script.

## API

| Prop   | Type                      | Default | Purpose                                               |
| ------ | ------------------------- | ------- | ----------------------------------------------------- |
| `data` | `Record<string, unknown>` | —       | The JSON-LD object, serialised with `JSON.stringify`. |

## Usage

```tsx
import { JsonLd } from "@/src/lib/shared/ui/JsonLd";
import { getBreadcrumbJsonLd } from "@/src/lib/shared/utils/json-ld.utils";

<JsonLd
  data={getBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: "Games", path: "/games" },
  ])}
/>;
```

## Rules and gotchas

- Render it from server components so the data is in the server HTML; it has no hooks and
  works there.
- Every `<` is escaped to `<`, so user text such as `</script>` in a game name cannot
  close the tag early. Keep that escape if the serialisation changes.
- Check structured data with Google's Rich Results Test; a "no schema found" conclusion
  drawn from `curl` output is a false finding.

## Storybook

No story: it renders an invisible script tag.
