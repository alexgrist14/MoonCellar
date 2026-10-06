import type {
  ICustomListsOrder,
  ISteamLibraryGame,
  ISteamLibrarySort,
} from "@mooncellar/schemas";
import {
  type IListGameSortKeys,
  sortListGames,
} from "../../collections/utils/list-games-sort.utils";

export type TSteamLibraryRow = ISteamLibraryGame & { position: number };

const isMastered = (row: TSteamLibraryRow) =>
  !!row.total && (row.unlocked ?? 0) >= row.total;

const compareProgress = (a: TSteamLibraryRow, b: TSteamLibraryRow) => {
  if (isMastered(a) !== isMastered(b)) return isMastered(a) ? 1 : -1;
  if (isMastered(a)) {
    return (a.masteredAt ?? "").localeCompare(b.masteredAt ?? "");
  }

  return a.unlocked! / a.total! - b.unlocked! / b.total!;
};

export const sortSteamLibrary = (
  rows: TSteamLibraryRow[],
  sortBy: ISteamLibrarySort,
  sortOrder: ICustomListsOrder,
  keysById: Map<string, IListGameSortKeys> = new Map()
): TSteamLibraryRow[] => {
  const direction = sortOrder === "asc" ? 1 : -1;

  if (sortBy === "achievements") {
    return [...rows].sort((a, b) => {
      const hasA = !!a.unlocked && !!a.total;
      const hasB = !!b.unlocked && !!b.total;

      if (hasA !== hasB) return hasA ? -1 : 1;
      if (!hasA) return a.position - b.position;

      return compareProgress(a, b) * direction || a.position - b.position;
    });
  }

  if (sortBy === "playtime") {
    return [...rows].sort(
      (a, b) => (a.playtime - b.playtime) * direction || a.position - b.position
    );
  }

  const byId = new Map(rows.map((row) => [row.gameId, row]));

  return sortListGames(
    rows.map(({ gameId, position }) => ({ gameId, position, addedAt: "" })),
    sortBy,
    sortOrder,
    keysById
  ).map(({ gameId }) => byId.get(gameId)!);
};
