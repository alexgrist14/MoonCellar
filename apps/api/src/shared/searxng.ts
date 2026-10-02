export const SEARCH_ENGINES_UNAVAILABLE = "Search engines unavailable";

const getSearxngUrl = () => process.env.SEARXNG_URL || "http://localhost:8891";

const search = async <T>(
  query: string,
  category?: string,
  page = 1
): Promise<T[]> => {
  const url = new URL("/search", getSearxngUrl());
  url.searchParams.set("q", query);
  url.searchParams.set("format", "json");
  if (category) url.searchParams.set("categories", category);
  if (page > 1) url.searchParams.set("pageno", String(page));

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `SearXNG request failed: ${res.status} ${await res.text()}`
    );
  }

  const { results = [], unresponsive_engines: unresponsive = [] } =
    (await res.json()) as {
      results?: T[];
      unresponsive_engines?: [string, string][];
    };

  if (!results.length && unresponsive.length) {
    throw new Error(
      `${SEARCH_ENGINES_UNAVAILABLE}: ${unresponsive
        .map(([engine, reason]) => `${engine} (${reason})`)
        .join(", ")}`
    );
  }

  return results;
};

export const searchWeb = async (query: string, count = 10) =>
  (await search<{ title: string; url: string; content?: string }>(query))
    .slice(0, count)
    .map(({ title, url, content }) => ({ title, url, content }));

export const searchImages = async (query: string, count = 15, page = 1) =>
  (
    await search<{
      title: string;
      url: string;
      img_src?: string;
      source?: string;
    }>(query, "images", page)
  )
    .filter((r) => r.img_src && !/\.svg(\?|$)/i.test(r.img_src))
    .slice(0, count)
    .map((r) => ({
      title: r.title,
      img_src: r.img_src!.startsWith("//") ? `https:${r.img_src}` : r.img_src,
      pageUrl: r.url,
      source: r.source,
    }));

const isYoutube = (url: string) =>
  /(^|\.)youtube\.com\/watch|youtu\.be\//.test(url);

export const searchYoutube = async (query: string, count = 10) =>
  (await search<{ title: string; url: string }>(query, "videos"))
    .filter((r) => isYoutube(r.url))
    .slice(0, count)
    .map(({ title, url }) => ({ title, url }));
