import { MetadataRoute } from "next";
import { gamesApi, userAPI } from "../lib/shared/api";
import { FRONT_URL, links } from "../lib/shared/constants";

export const dynamic = "force-dynamic";

async function getAllGameSlugs(): Promise<string[]> {
  const { data: slugs } = await gamesApi.getSlugs();

  return slugs;
}

async function getAllUserLogins(): Promise<string[]> {
  const { data: logins } = await userAPI.getLogins();

  return logins;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gameSlugs = await getAllGameSlugs().catch(() => []);
  const userLogins = await getAllUserLogins().catch(() => []);

  return [
    ...links.map(({ link }) => ({
      url: `${FRONT_URL}${link === "/" ? "" : link}`,
      lastModified: new Date(),
    })),
    ...gameSlugs.map((slug) => ({
      url: `${FRONT_URL}/games/${slug}`,
    })),
    ...userLogins.map((login) => ({
      url: `${FRONT_URL}/user/${login}`,
    })),
  ];
}
