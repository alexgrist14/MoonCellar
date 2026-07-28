import { MetadataRoute } from "next";
import { unstable_cache } from "next/cache";
import { gamesApi, userAPI } from "../lib/shared/api";
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

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gameSlugs = await getAllGameSlugs().catch(() => []);
  const userLogins = await getAllUserLogins().catch(() => []);

  return [
    ...links.map(({ link }) => ({
      url: `${FRONT_URL}${link === "/" ? "" : link}`,
      lastModified: new Date(),
    })),
    ...gameSlugs.map(({ slug, updatedAt, cover }) => ({
      url: `${FRONT_URL}/games/${slug}`,
      lastModified: new Date(updatedAt),
      ...(cover && {
        images: [
          `${FRONT_URL}/api/image-proxy?url=${encodeURIComponent(cover)}`,
        ],
      }),
    })),
    ...userLogins.map(({ userName, updatedAt }) => ({
      url: `${FRONT_URL}/user/${userName}`,
      lastModified: new Date(updatedAt),
    })),
  ];
}
