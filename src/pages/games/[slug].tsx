import { GamePage } from "@/src/lib/pages/GamePage";
import { IGDBApi } from "@/src/lib/shared/api";
import { getImageLink } from "@/src/lib/shared/constants";
import { IGDBGame } from "@/src/lib/shared/types/igdb";
import { CheckMobile } from "@/src/lib/shared/ui/CheckMobile";
import { GetServerSidePropsContext } from "next";
import Head from "next/head";
import { FC } from "react";

const GamePageIndex: FC<{ game: IGDBGame }> = ({ game }) => {
  return (
    <div>
      <Head>
        <title>{game.name}</title>
        <meta property="title" content={game.name} key="title" />
        {!!game.summary && (
          <meta property="description" content={game.summary} key="title" />
        )}
        <meta property="og:title" content={game.name} key="title" />
        {!!game.summary && (
          <meta property="og:description" content={game.summary} key="title" />
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
      </Head>
      <CheckMobile>
        <GamePage game={game} />
      </CheckMobile>
    </div>
  );
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const game = (await IGDBApi.getGameBySlug(query.slug as string)).data;

  return { props: { game } };
};

export default GamePageIndex;
