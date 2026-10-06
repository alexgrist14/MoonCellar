import {
  sortSteamLibrary,
  type TSteamLibraryRow,
} from "./steam-library-sort.utils";

const row = (
  gameId: string,
  position: number,
  progress: Partial<TSteamLibraryRow> = {}
): TSteamLibraryRow => ({
  gameId,
  appId: position,
  playtime: 100 - position,
  unlocked: null,
  total: null,
  masteredAt: null,
  position,
  ...progress,
});

const rows = [
  row("none-1", 1),
  row("half", 2, { unlocked: 5, total: 10 }),
  row("mastered-old", 3, { unlocked: 4, total: 4, masteredAt: "2024-01-01" }),
  row("none-2", 4),
  row("mastered-new", 5, { unlocked: 9, total: 9, masteredAt: "2025-06-01" }),
  row("little", 6, { unlocked: 1, total: 10 }),
];

const ids = (sorted: TSteamLibraryRow[]) => sorted.map(({ gameId }) => gameId);

describe("sortSteamLibrary", () => {
  it("puts mastered games first, newest first, then progress, then games without achievements", () => {
    expect(ids(sortSteamLibrary(rows, "achievements", "desc"))).toEqual([
      "mastered-new",
      "mastered-old",
      "half",
      "little",
      "none-1",
      "none-2",
    ]);
  });

  it("keeps games without achievements last in ascending order", () => {
    expect(
      ids(sortSteamLibrary(rows, "achievements", "asc")).slice(-2)
    ).toEqual(["none-1", "none-2"]);
    expect(ids(sortSteamLibrary(rows, "achievements", "asc"))[0]).toBe(
      "little"
    );
  });

  it("sorts by playtime", () => {
    expect(ids(sortSteamLibrary(rows, "playtime", "desc"))[0]).toBe("none-1");
    expect(ids(sortSteamLibrary(rows, "playtime", "asc"))[0]).toBe("little");
  });

  it("sorts by name through the list sort keys", () => {
    const keys = new Map(rows.map(({ gameId }) => [gameId, { name: gameId }]));

    expect(ids(sortSteamLibrary(rows, "name", "asc", keys))[0]).toBe("half");
  });
});
