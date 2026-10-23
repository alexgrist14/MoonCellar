import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { ArticlePage } from "@/src/lib/pages/ArticlePage";
import { articlesAPI, gamesApi } from "@/src/lib/shared/api";
import { FRONT_URL } from "@/src/lib/shared/constants";
import { JsonLd } from "@/src/lib/shared/ui/JsonLd";
import {
  getArticleJsonLd,
  getBreadcrumbJsonLd,
} from "@/src/lib/shared/utils/json-ld.utils";
import { fetchOrNull } from "@/src/lib/shared/utils/not-found.utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

const getArticle = cache(async (slug: string) =>
  fetchOrNull(articlesAPI.getBySlug(slug))
);

const getGame = cache(async (gameId: string) =>
  gamesApi
    .getByIds({ _ids: [gameId] })
    .then(({ data }) => data[0] ?? null)
    .catch(() => null)
);

const getStats = cache(async (gameId: string) =>
  gamesApi
    .getStats(gameId)
    .then(({ data }) => data)
    .catch(() => undefined)
);

const getLatest = cache(async () =>
  articlesAPI
    .getArticles({ take: 4 })
    .then(({ data }) => data.results)
    .catch(() => [])
);

const getShareImage = (
  image: string | null,
  game: { cover: string | null; isAdult: boolean } | null
) => image ?? (game && !game.isAdult ? game.cover : null);

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticle(slug).catch((error: unknown) => {
    console.error("Failed to load post metadata:", error);

    return undefined;
  });

  if (article === undefined) {
    return { title: "News" };
  }

  if (!article) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

  const image = getShareImage(article.image, article.game);

  return {
    title: article.title,
    description: article.summary,
    alternates: {
      canonical: `/news/${article.slug}`,
    },
    openGraph: {
      title: article.title,
      description: article.summary,
      siteName: "MoonCellar",
      type: "article",
      locale: "en_US",
      url: `${FRONT_URL}/news/${article.slug}`,
      ...(article.publishedAt && { publishedTime: article.publishedAt }),
      modifiedTime: article.updatedAt,
      images: [
        image
          ? {
              url: `${FRONT_URL}/img/image-proxy?url=${encodeURIComponent(image)}`,
              alt: article.title,
            }
          : {
              url: "/images/og-default.png",
              width: 1200,
              height: 630,
              alt: "MoonCellar — game tracker and backlog database",
              type: "image/png",
            },
      ],
    },
  };
}

const ArticlePageIndex = async ({
  params,
}: {
  params: Promise<{ slug: string }>;
}) => {
  const { slug } = await params;
  const article = await getArticle(slug);

  if (!article) {
    notFound();
  }

  const [game, stats, latest] = await Promise.all([
    article.game ? getGame(article.game._id) : null,
    article.game ? getStats(article.game._id) : undefined,
    article.game ? [] : getLatest(),
  ]);

  return (
    <>
      <JsonLd
        data={getArticleJsonLd(
          article,
          getShareImage(article.image, article.game)
        )}
      />
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "News", path: "/news" },
          { name: article.title, path: `/news/${article.slug}` },
        ])}
      />
      <ArticlePage
        article={article}
        game={game}
        stats={stats}
        latest={latest}
      />
    </>
  );
};

export default ArticlePageIndex;
