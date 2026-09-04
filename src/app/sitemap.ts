import { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { gamesApi, userAPI } from "../lib/shared/api";
import { platformsAPI } from "../lib/shared/api/platforms.api";
import { toSlug } from "../lib/shared/utils/slug.utils";
import { IGetGameSlugsResponse } from "../lib/shared/lib/schemas/games.schema";
import { IGetUserLoginsResponse } from "../lib/shared/lib/schemas/user.schema";
import { FRONT_URL, links } from "../lib/shared/constants";

export const dynamic = "force-dynamic";

const getAllGameSlugs = unstable_cache(
  async (): Promise<IGetGameSlugsResponse> => {
    const { data } = await gamesApi.getSlugs();

    return data;
  },
  ["sitemap-game-slugs"],
  { revalidate: 3600 }
);

const getAllUserLogins = unstable_cache(
  async (): Promise<IGetUserLoginsResponse> => {
    const { data } = await userAPI.getLogins();

    return data;
  },
  ["sitemap-user-logins"],
  { revalidate: 3600 }
);

const MIN_GAMES_FOR_HUB = 100;

const getGenreCounts = unstable_cache(
  async () => {
    const { data } = await gamesApi.getTotalGamesByCount();

    return data;
  },
  ["sitemap-genre-counts"],
  { revalidate: 3600 }
);

const getPlatforms = unstable_cache(
  async () => {
    const { data } = await platformsAPI.getAll();

    return data;
  },
  ["sitemap-platforms"],
  { revalidate: 3600 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gameSlugs = await getAllGameSlugs().catch(() => []);
  const userLogins = await getAllUserLogins().catch(() => []);
  const genres = await getGenreCounts().catch(() => []);
  const platforms = await getPlatforms().catch(() => []);

  return [
    ...links.map(({ link }) => ({
      url: `${FRONT_URL}${link}`,
      lastModified: new Date(),
    })),
    ...gameSlugs.map(({ slug, updatedAt, cover }) => ({
      url: `${FRONT_URL}/games/${slug}`,
      lastModified: new Date(updatedAt),
      ...(cover && {
        images: [
          `${FRONT_URL}/img/image-proxy?url=${encodeURIComponent(cover)}`,
        ],
      }),
    })),
    ...genres
      .filter(({ count }) => count >= MIN_GAMES_FOR_HUB)
      .map(({ genre }) => ({
        url: `${FRONT_URL}/games/genre/${toSlug(genre)}`,
        lastModified: new Date(),
      })),
    ...platforms.map(({ slug }) => ({
      url: `${FRONT_URL}/games/platform/${slug}`,
      lastModified: new Date(),
    })),
    ...userLogins.map(({ userName, updatedAt }) => ({
      url: `${FRONT_URL}/user/${userName}`,
      lastModified: new Date(updatedAt),
    })),
  ];
}
