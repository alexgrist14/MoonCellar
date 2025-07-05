import { GamePage } from "@/src/lib/pages/GamePage";
import { IGDBApi } from "@/src/lib/shared/api";
import { getImageLink } from "@/src/lib/shared/constants";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const game = (await IGDBApi.getGameBySlug((await params).slug)).data;

  return {
    title: game.name,
    description: game.summary,
    other: {
      url: `https://mooncellar.space/games/${game.slug}`,
      ...(!!game.cover?.url && {
        image: getImageLink(game.cover.url, "cover_small"),
      }),
    },
  };
}

const GamePageIndex = async ({ params }: { params: any }) => {
  const game = (await IGDBApi.getGameBySlug((await params).slug)).data;

  return (
    <CheckMobile>
      <GamePage game={game} />
    </CheckMobile>
  );
};

export default GamePageIndex;
