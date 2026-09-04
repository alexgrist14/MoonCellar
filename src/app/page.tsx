import { MainPage } from "../lib/pages/Main";
import {
  IGameResponse,
  IGenreResponse,
  IUpcomingReleaseGroup,
} from "../lib/shared/lib/schemas/games.schema";
import { gamesApi } from "../lib/shared/api";
import { platformsAPI } from "../lib/shared/api/platforms.api";
import { unstable_cache } from "next/cache";
import { IPlatformCount } from "../lib/shared/types/games.type";
import { Metadata } from "next";
import {
  MAIN_PAGE_DESCRIPTION,
  MAIN_PAGE_META_TITLE,
} from "../lib/pages/Main/MainPage.constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { absolute: MAIN_PAGE_META_TITLE },
  description: MAIN_PAGE_DESCRIPTION,
  keywords: [
    "game collection",
    "games collection",
    "game library",
    "games library",
    "game tracker",
    "games tracker",
    "top rated games",
    "upcoming games",
  ],
  alternates: {
    canonical: "/",
  },
};

const FEATURED_PLATFORM_SLUGS = [
  "win",
  "ps5",
  "ps4--1",
  "switch",
  "series-x-s",
  "ps2",
  "xbox360",
  "snes",
  "nes",
  "genesis-slash-megadrive",
];

const getFeaturedPlatforms = unstable_cache(
  async (): Promise<IPlatformCount[]> => {
    const platforms = await platformsAPI
      .getAll()
      .then(({ data }) => data)
      .catch(() => []);

    const featured = FEATURED_PLATFORM_SLUGS.map((slug) =>
      platforms.find((platform) => platform.slug === slug)
    ).filter((platform) => !!platform);

    return Promise.all(
      featured.map(async (platform) => {
        const { total } = await gamesApi
          .getAll({ selected: { platforms: [platform._id] }, take: 1, page: 1 })
          .then(({ data }) => data)
          .catch(() => ({ total: 0 }));

        return { name: platform.name, slug: platform.slug, count: total };
      })
    );
  },
  ["main-featured-platforms"],
  { revalidate: 3600 }
);

async function getGames(): Promise<{
  topRated: IGameResponse[];
  genre: IGenreResponse[];
  upcoming: IUpcomingReleaseGroup[];
  recent: IGameResponse[];
}> {
  const [topRated, genre, upcoming, recent] = await Promise.all([
    gamesApi
      .getTopRatedRandom()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load top rated games:", error);
        return [] as IGameResponse[];
      }),
    gamesApi
      .getTotalGamesByCount()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load genres:", error);
        return [] as IGenreResponse[];
      }),
    gamesApi
      .getUpcomingReleases()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load upcoming releases:", error);
        return [] as IUpcomingReleaseGroup[];
      }),
    gamesApi
      .getRecentReleases()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load recent releases:", error);
        return [] as IGameResponse[];
      }),
  ]);

  return { topRated, genre, upcoming, recent };
}

export default async function Home() {
  const [games, platforms] = await Promise.all([
    getGames(),
    getFeaturedPlatforms().catch(() => [] as IPlatformCount[]),
  ]);

  return <MainPage games={games} platforms={platforms} />;
}
