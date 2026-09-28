import type {
  ICustomListGame,
  ICustomListGamesSort,
  ICustomListsOrder,
} from "@mooncellar/schemas";

export interface IListGameSortKeys {
  name?: string;
  release?: number | null;
  rating?: number | null;
}

type ISortValue = string | number | null | undefined;

const getSortValue = (
  game: ICustomListGame,
  sortBy: ICustomListGamesSort,
  keys?: IListGameSortKeys
): ISortValue => {
  switch (sortBy) {
    case "position":
      return game.position;
    case "addedAt":
      return Date.parse(game.addedAt);
    default:
      return keys?.[sortBy];
  }
};

export function sortListGames(
  games: ICustomListGame[],
  sortBy: ICustomListGamesSort,
  sortOrder: ICustomListsOrder,
  keysById: Map<string, IListGameSortKeys> = new Map()
): ICustomListGame[] {
  const direction = sortOrder === "asc" ? 1 : -1;

  return games
    .map((game) => ({
      game,
      value: getSortValue(game, sortBy, keysById.get(game.gameId)),
    }))
    .sort((a, b) => {
      const isMissingA = a.value == null || a.value === "";
      const isMissingB = b.value == null || b.value === "";

      if (isMissingA !== isMissingB) return isMissingA ? 1 : -1;

      if (!isMissingA && a.value !== b.value) {
        const compared =
          typeof a.value === "string"
            ? a.value.localeCompare(String(b.value), "en", {
                sensitivity: "base",
                numeric: true,
              })
            : Number(a.value) - Number(b.value);

        if (compared) return compared * direction;
      }

      return a.game.position - b.game.position;
    })
    .map(({ game }) => game);
}
