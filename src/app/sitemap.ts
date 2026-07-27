import { MetadataRoute } from "next";
import { gamesApi } from "../lib/shared/api";
import { FRONT_URL, links } from "../lib/shared/constants";

const TAKE = 1000;
const MAX_PAGES = 50;

async function getAllGameSlugs(): Promise<string[]> {
  const slugs: string[] = [];
  let page = 1;

  while (page <= MAX_PAGES) {
    const { data } = await gamesApi.getAll({ take: TAKE, page });

    slugs.push(...data.results.map((game) => game.slug));

    if (!data.results.length || slugs.length >= data.total) break;

    page += 1;
  }

  return slugs;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const gameSlugs = await getAllGameSlugs().catch(() => []);

  return [
    ...links.map(({ link }) => ({
      url: `${FRONT_URL}${link === "/" ? "" : link}`,
      lastModified: new Date(),
    })),
    ...gameSlugs.map((slug) => ({
      url: `${FRONT_URL}/games/${slug}`,
    })),
  ];
}
