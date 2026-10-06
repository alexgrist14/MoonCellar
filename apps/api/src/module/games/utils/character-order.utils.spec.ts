import {
  getCharacterRank,
  sortCharactersByRole,
} from "./character-order.utils";

describe("sortCharactersByRole", () => {
  it("orders VNDB characters by their role in the game's VN", () => {
    const characters = [
      { name: "Akiha", vndb: { roles: { v7: "primary" } } },
      { name: "Hisui", vndb: { roles: { v7: "side" } } },
      { name: "Shiki", vndb: { roles: { v7: "main", v9: "side" } } },
      { name: "Aoko", vndb: { roles: { v7: "appears" } } },
      { name: "Arcueid", vndb: { roles: { v7: "primary" } } },
    ];

    expect(
      sortCharactersByRole(characters, "v7").map(({ name }) => name)
    ).toEqual(["Shiki", "Akiha", "Arcueid", "Hisui", "Aoko"]);
  });

  it("puts an IGDB protagonist first and keeps the rest by name", () => {
    const characters = [
      { name: "Ciel", description: "A member of the Burial Agency." },
      { name: "Shiki", description: "The main protagonist of the story." },
      { name: "Akiha", description: null },
    ];

    expect(sortCharactersByRole(characters).map(({ name }) => name)).toEqual([
      "Shiki",
      "Akiha",
      "Ciel",
    ]);
  });

  it("prefers the role an admin set for the game", () => {
    const characters = [
      { name: "Arcueid", vndb: { roles: { v7: "main" } } },
      {
        name: "Shiki",
        roles: [{ gameId: "g1", role: "side" }],
        vndb: { roles: { v7: "main" } },
      },
    ];

    expect(
      sortCharactersByRole(characters, "v7", "g1").map(({ name }) => name)
    ).toEqual(["Arcueid", "Shiki"]);
    expect(getCharacterRank(characters[1], "v7", "g1")).toBe(3);
    expect(getCharacterRank(characters[1], "v7", "g2")).toBe(0);
  });

  it("reads the role of the game's own VN only", () => {
    expect(getCharacterRank({ vndb: { roles: { v9: "main" } } }, "v7")).toBe(2);
  });
});
