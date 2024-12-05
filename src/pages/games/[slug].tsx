import { GamePage } from "@/src/lib/pages/GamePage";
import { IGDBApi } from "@/src/lib/shared/api";
import { IGDBGame } from "@/src/lib/shared/types/igdb";
import { GetServerSidePropsContext } from "next";
import { FC } from "react";

const GamePageIndex: FC<{ game: IGDBGame }> = ({ game }) => {
  return <GamePage game={game} />;
};

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const { query } = context;
  const game = (await IGDBApi.getGameBySlug(query.slug as string)).data;

  return { props: { game } };
};

export default GamePageIndex;
