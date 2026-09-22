import { FRONT_URL } from "@/src/lib/shared/constants";
import { IGameResponse, IReview } from "@mooncellar/schemas";

const MIN_RATINGS_FOR_AGGREGATE = 10;

type IRatedReview = IReview & {
  rating: number;
  author: NonNullable<IReview["author"]>;
};

const absolute = (path: string) => `${FRONT_URL}${path}`;

const toPlainText = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const isIndexableReview = (review: IReview): review is IRatedReview =>
  review.rating !== null &&
  !!review.author &&
  !review.isSpoiler &&
  !!review.comment;

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

export const getVideoGameJsonLd = (
  game: IGameResponse,
  reviews: IReview[] = []
) => {
  const indexableReviews = reviews.filter(isIndexableReview);

  return {
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
    ...(!!indexableReviews.length && {
      review: indexableReviews.map((review) => ({
        "@type": "Review",
        author: { "@type": "Person", name: review.author.userName },
        reviewBody: toPlainText(review.comment ?? ""),
        datePublished: review.updatedAt.slice(0, 10),
        reviewRating: {
          "@type": "Rating",
          ratingValue: review.rating,
          bestRating: 10,
          worstRating: 1,
        },
      })),
    }),
  };
};
