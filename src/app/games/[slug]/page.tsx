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
    other: {
      url: `https://mooncellar.space/games/${game.slug}`,
      ...(!!game.cover && {
        image: game.cover,
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
