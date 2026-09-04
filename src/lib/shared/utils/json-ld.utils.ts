import { FRONT_URL } from "../constants";
import { IGameResponse } from "../lib/schemas/games.schema";

const MIN_RATINGS_FOR_AGGREGATE = 10;

const absolute = (path: string) => `${FRONT_URL}${path}`;

const coverUrl = (cover: string) =>
  `${FRONT_URL}/img/image-proxy?url=${encodeURIComponent(cover)}`;

export const getWebSiteJsonLd = () => ({
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "MoonCellar",
  url: FRONT_URL,
  potentialAction: {
    "@type": "SearchAction",
    target: {
      "@type": "EntryPoint",
      urlTemplate: `${FRONT_URL}/games?search={search_term_string}`,
    },
    "query-input": "required name=search_term_string",
  },
});

export const getBreadcrumbJsonLd = (
  items: { name: string; path: string }[]
) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map(({ name, path }, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name,
    item: absolute(path),
  })),
});

export const getItemListJsonLd = (games: IGameResponse[]) => ({
  "@context": "https://schema.org",
  "@type": "ItemList",
  numberOfItems: games.length,
  itemListElement: games.map((game, index) => ({
    "@type": "ListItem",
    position: index + 1,
    url: absolute(`/games/${game.slug}`),
    name: game.name,
  })),
});

export const getVideoGameJsonLd = (game: IGameResponse) => ({
  "@context": "https://schema.org",
  "@type": "VideoGame",
  name: game.name,
  url: absolute(`/games/${game.slug}`),
  ...(!!game.summary && { description: game.summary }),
  ...(!!game.cover && { image: coverUrl(game.cover) }),
  ...(!!game.genres?.length && { genre: game.genres }),
  ...(!!game.first_release && {
    datePublished: new Date(game.first_release * 1000)
      .toISOString()
      .slice(0, 10),
  }),
  ...(!!game.averageRating &&
    (game.ratingsCount ?? 0) >= MIN_RATINGS_FOR_AGGREGATE && {
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: game.averageRating,
        ratingCount: game.ratingsCount,
        bestRating: 10,
        worstRating: 1,
      },
    }),
});
