import { GamePage } from "@/src/lib/pages/GamePage";
import { gamesApi } from "@/src/lib/shared/api";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const isValidSlug = (slug: string) => !slug.includes(".");

const extToMimeType: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
};

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const { slug } = await params;
  if (!isValidSlug(slug)) {
    notFound();
  }

  const game = (await gamesApi.getBySlug({ slug })).data;
  const description =
    game.summary || `${game.name} on MoonCellar — ratings, achievements and playthrough tracking`;

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
    openGraph: {
      title: game.name,
      description,
      url: `https://mooncellar.space/games/${game.slug}`,
      ...(!!game.cover && {
        images: [
          {
            url: `https://mooncellar.space/api/image-proxy?url=${encodeURIComponent(game.cover)}`,
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
  if (!isValidSlug(slug)) {
    notFound();
  }

  const game = (await gamesApi.getBySlug({ slug })).data;

  return (
    <CheckMobile>
      <GamePage game={game} />
    </CheckMobile>
  );
};

export default GamePageIndex;
