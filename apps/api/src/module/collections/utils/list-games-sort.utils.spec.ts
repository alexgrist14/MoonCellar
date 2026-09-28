import { sortListGames } from "./list-games-sort.utils";

const games = [
  { gameId: "a", addedAt: "2026-01-03T00:00:00.000Z", position: 1 },
  { gameId: "b", addedAt: "2026-01-01T00:00:00.000Z", position: 2 },
  { gameId: "c", addedAt: "2026-01-02T00:00:00.000Z", position: 3 },
];

const keys = new Map([
  ["a", { name: "zelda", release: null, rating: 8 }],
  ["b", { name: "Ape Escape", release: 2000, rating: null }],
  ["c", { name: "metroid 2", release: 1991, rating: 9.5 }],
]);

const ids = (sorted: typeof games) => sorted.map((game) => game.gameId);

describe("sortListGames", () => {
  it("keeps the list order and reverses it", () => {
    expect(ids(sortListGames(games, "position", "asc"))).toEqual(["a", "b", "c"]);
    expect(ids(sortListGames(games, "position", "desc"))).toEqual(["c", "b", "a"]);
  });

  it("sorts by the date a game was added", () => {
    expect(ids(sortListGames(games, "addedAt", "desc"))).toEqual(["a", "c", "b"]);
  });

  it("sorts names without regard to case", () => {
    expect(ids(sortListGames(games, "name", "asc", keys))).toEqual(["b", "c", "a"]);
  });

  it("puts games without a value last in both directions", () => {
    expect(ids(sortListGames(games, "rating", "desc", keys))).toEqual(["c", "a", "b"]);
    expect(ids(sortListGames(games, "rating", "asc", keys))).toEqual(["a", "c", "b"]);
    expect(ids(sortListGames(games, "release", "asc", keys))).toEqual(["c", "b", "a"]);
  });
});
