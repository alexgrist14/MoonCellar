import { MainPage } from "../lib/pages/Main";
import {
  IGameResponse,
  IGenreResponse,
} from "../lib/shared/lib/schemas/games.schema";
import { gamesApi } from "../lib/shared/api";

async function getGames(): Promise<{
  topRated: IGameResponse[];
  genre: IGenreResponse[];
}> {
  try {
    const topRatedResponse = await gamesApi.getTopRatedRandom();
    const genreResponse = await gamesApi.getTotalGamesByCount();

    return { topRated: topRatedResponse.data, genre: genreResponse.data };
  } catch (error) {
    console.error("Failed to load top rated games:", error);
    return { topRated: [], genre: [] };
  }
}

export default async function Home() {
  const games = await getGames();

  return <MainPage games={games} />;
}
