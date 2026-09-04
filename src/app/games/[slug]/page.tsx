import { GamePage } from "@/src/lib/pages/GamePage";
import { gamesApi } from "@/src/lib/shared/api";
import { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";
import { fetchOrNull } from "@/src/lib/shared/utils/not-found.utils";
import { FRONT_URL } from "@/src/lib/shared/constants";
import { JsonLd } from "@/src/lib/shared/ui/JsonLd";
import {
  getBreadcrumbJsonLd,
  getVideoGameJsonLd,
} from "@/src/lib/shared/utils/json-ld.utils";

export const revalidate = 3600;

export async function generateStaticParams() {
  return [];
}

const isValidSlug = (slug: string) => !slug.includes(".");

const extToMimeType: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

const getGame = cache(async (slug: string) =>
  isValidSlug(slug) ? fetchOrNull(gamesApi.getBySlug({ slug })) : null
);

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

  const description =
    game.summary ||
    `${game.name} on MoonCellar — ratings, achievements and playthrough tracking`;

  const keywords = [
    game.name,
    ...(game.genres ?? []),
    ...(game.themes ?? []),
    ...(game.keywords ?? []),
  ];

  return {
    title: game.name,
    description,
    keywords,
    alternates: {
      canonical: `/games/${game.slug}`,
    },
    openGraph: {
      title: game.name,
      description,
      siteName: "MoonCellar",
      type: "website",
      locale: "en_US",
      url: `${FRONT_URL}/games/${game.slug}`,
      ...(!!game.cover && {
        images: [
          {
            url: `${FRONT_URL}/img/image-proxy?url=${encodeURIComponent(game.cover)}`,
            width: 200,
            height: 266,
            alt: game.name,
            type: extToMimeType[game.cover.split(".").pop()!.toLowerCase()],
          },
        ],
      }),
    },
  };
}

const GamePageIndex = async ({ params }: { params: any }) => {
  const { slug } = await params;
  const game = await getGame(slug);

  if (!game) {
    notFound();
  }

  return (
    <>
      <JsonLd data={getVideoGameJsonLd(game)} />
      <JsonLd
        data={getBreadcrumbJsonLd([
          { name: "Home", path: "/" },
          { name: "Games", path: "/games" },
          { name: game.name, path: `/games/${game.slug}` },
        ])}
      />
      <GamePage game={game} />
    </>
  );
};

export default GamePageIndex;
