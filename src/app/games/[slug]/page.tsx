import { GamePage } from "@/src/lib/pages/GamePage";
import { IGDBApi } from "@/src/lib/shared/api";
import { getImageLink } from "@/src/lib/shared/constants";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import Head from "next/head";

const GamePageIndex = async ({ params }: { params: any }) => {
  const game = (await IGDBApi.getGameBySlug(params.slug)).data;

  return (
    <div>
      <Head>
        <title>{game.name}</title>
        <meta property="title" content={game.name} key="title" />
        <meta property="og:title" content={game.name} key="title" />
        {!!game.summary && (
          <>
            <meta property="description" content={game.summary} key="title" />
            <meta
              property="og:description"
              content={game.summary}
              key="title"
            />
          </>
        )}
        {!!game.cover && (
          <>
            <meta
              property="image"
              content={getImageLink(game.cover.url, "cover_small")}
            />
            <meta
              property="og:image"
              content={getImageLink(game.cover.url, "cover_small")}
            />
          </>
        )}
        {!!game.slug && (
          <>
            <meta
              property="url"
              content={`https://mooncellar.space/games/${game.slug}`}
            />
            <meta
              property="og:url"
              content={`https://mooncellar.space/games/${game.slug}`}
            />
          </>
        )}
        <meta property="type" content="website" />
        <meta property="og:type" content="website" />
      </Head>
      <CheckMobile>
        <GamePage game={game} />
      </CheckMobile>
    </div>
  );
};

export default GamePageIndex;
