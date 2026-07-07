import { GamePage } from "@/src/lib/pages/GamePage";
import { gamesApi } from "@/src/lib/shared/api";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const game = (await gamesApi.getBySlug({ slug: (await params).slug })).data;

  return {
    title: game.name,
    description: game.summary,
    openGraph: {
      title: game.name,
      description: game.summary,
      url: `https://mooncellar.net/games/${game.slug}`,
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
  const game = (await gamesApi.getBySlug({ slug: (await params).slug })).data;

  return (
    <CheckMobile>
      <GamePage game={game} />
    </CheckMobile>
  );
};

export default GamePageIndex;
