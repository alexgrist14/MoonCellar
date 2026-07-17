import { GamePage } from "@/src/lib/pages/GamePage";
import { gamesApi } from "@/src/lib/shared/api";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { Metadata } from "next";
import { notFound } from "next/navigation";

const isValidSlug = (slug: string) => !slug.includes(".");

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

  return {
    title: game.name,
    description: game.summary,
    openGraph: {
      title: game.name,
      description: game.summary,
      url: `https://mooncellar.space/games/${game.slug}`,
      ...(!!game.cover && {
        images: [{
          url: game.cover,
          width: 528,
          height: 704,
          alt: game.name,
          type: "image/jpeg",
        }],
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
