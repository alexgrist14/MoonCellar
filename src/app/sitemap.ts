import { MetadataRoute } from "next";
import { gamesApi, userAPI } from "../lib/shared/api";
import { IGetGameSlugsResponse } from "../lib/shared/lib/schemas/games.schema";
import { IGetUserLoginsResponse } from "../lib/shared/lib/schemas/user.schema";
import { FRONT_URL, links } from "../lib/shared/constants";

export const revalidate = 3600;

async function getAllGameSlugs(): Promise<IGetGameSlugsResponse> {
  const { data } = await gamesApi.getSlugs();

  return data;
}

async function getAllUserLogins(): Promise<IGetUserLoginsResponse> {
  const { data } = await userAPI.getLogins();

  return data;
}

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
