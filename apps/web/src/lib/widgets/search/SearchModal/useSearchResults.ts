import { useMemo } from "react";
import { useGamesQuery } from "@/src/lib/entities/game/api/game.queries";
import { useListsQuery } from "@/src/lib/entities/list/api/list.queries";
import { useUsersSearchQuery } from "@/src/lib/entities/user/api/users-search.queries";
import { takeGames } from "@/src/lib/shared/constants/games.const";
import { ISearchTab } from "@/src/lib/shared/store/search.store";

export const SEARCH_LISTS_PREVIEW = 6;

export interface ISearchCount {
  value?: number;
  isPending: boolean;
}

export const useSearchResults = (query: string, isDebouncing: boolean) => {
  const isReady = query.length >= 2;

  const games = useGamesQuery({ search: query, take: takeGames }, isReady);
  const users = useUsersSearchQuery(query, isReady);
  const lists = useListsQuery(
    { search: query, take: SEARCH_LISTS_PREVIEW },
    { enabled: isReady }
  );

  const counts = useMemo<Record<ISearchTab, ISearchCount>>(
    () => ({
      games: {
        value: games.data?.total,
        isPending: isDebouncing || games.isLoading,
      },
      users: {
        value: users.data?.pages[0]?.total,
        isPending: isDebouncing || users.isLoading,
      },
      lists: {
        value: lists.data?.total,
        isPending: isDebouncing || lists.isLoading || lists.isPlaceholderData,
      },
    }),
    [games, users, lists, isDebouncing]
  );

  return { isReady, games, users, lists, counts };
};
