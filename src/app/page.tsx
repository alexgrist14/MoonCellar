import { MainPage } from "../lib/pages/Main";
import {
  IGameResponse,
  IGenreResponse,
  IUpcomingReleaseGroup,
} from "../lib/shared/lib/schemas/games.schema";
import { gamesApi } from "../lib/shared/api";

export const dynamic = "force-dynamic";

async function getGames(): Promise<{
  topRated: IGameResponse[];
  genre: IGenreResponse[];
  upcoming: IUpcomingReleaseGroup[];
  recent: IGameResponse[];
}> {
  const [topRated, genre, upcoming, recent] = await Promise.all([
    gamesApi
      .getTopRatedRandom()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load top rated games:", error);
        return [] as IGameResponse[];
      }),
    gamesApi
      .getTotalGamesByCount()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load genres:", error);
        return [] as IGenreResponse[];
      }),
    gamesApi
      .getUpcomingReleases()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load upcoming releases:", error);
        return [] as IUpcomingReleaseGroup[];
      }),
    gamesApi
      .getRecentReleases()
      .then((res) => res.data)
      .catch((error) => {
        console.error("Failed to load recent releases:", error);
        return [] as IGameResponse[];
      }),
  ]);

  return { topRated, genre, upcoming, recent };
}

export default async function Home() {
  const games = await getGames();

  return <MainPage games={games} />;
}
