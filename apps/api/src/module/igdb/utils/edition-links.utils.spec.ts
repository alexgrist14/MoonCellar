import { buildEditionLinks } from "./edition-links.utils";

const game = (id: string, gameId: number, versionParent?: number | null) => ({
  _id: id,
  igdb: { gameId, version_parent: versionParent ?? null },
});

describe("buildEditionLinks", () => {
  const links = buildEditionLinks([
    game("record", 142911),
    game("limited", 300, 142911),
    game("animate", 418824, 142911),
    game("orphan", 500, 999),
    game("other", 600),
  ]);

  it("links an edition to its original and to the other editions", () => {
    expect(links.get("animate")).toEqual({
      version_parent: "record",
      editions: ["limited"],
    });
  });

  it("lists every edition on the original", () => {
    expect(links.get("record")).toEqual({
      version_parent: undefined,
      editions: ["limited", "animate"],
    });
  });

  it("skips games whose original is not in the catalogue", () => {
    expect(links.has("orphan")).toBe(false);
    expect(links.has("other")).toBe(false);
  });
});
