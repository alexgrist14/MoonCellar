import type { IRAAward } from "@mooncellar/schemas";
import { pickGamesForSets, pickRaResults } from "./ra-playthroughs.service";

const award = (
  awardData: number,
  awardType: IRAAward["awardType"],
  awardedAt: string
): IRAAward => ({
  awardData,
  awardType,
  awardedAt,
  awardDataExtra: 1,
  displayOrder: 0,
  title: "Game",
  consoleName: "PlayStation 2",
  flags: 0,
  imageIcon: "https://media.retroachievements.org/Images/1.png",
});

describe("pickRaResults", () => {
  it("prefers a mastery over a beaten award for the same set", () => {
    const results = pickRaResults([
      award(10, "Game Beaten", "2026-01-05T10:00:00Z"),
      award(10, "Mastery/Completion", "2026-02-01T10:00:00Z"),
    ]);

    expect(results.get(10)).toEqual({ isMastered: true, date: "2026-02-01" });
  });

  it("keeps a beaten award as a completed playthrough", () => {
    const results = pickRaResults([
      award(11, "Game Beaten", "2025-03-02T21:05:00Z"),
    ]);

    expect(results.get(11)).toEqual({ isMastered: false, date: "2025-03-02" });
  });

  it("takes the earliest date among awards of the same kind", () => {
    const results = pickRaResults([
      award(12, "Mastery/Completion", "2026-05-01T00:00:00Z"),
      award(12, "Mastery/Completion", "2026-04-01T00:00:00Z"),
    ]);

    expect(results.get(12)?.date).toBe("2026-04-01");
  });

  it("ignores awards that are not about finishing a game", () => {
    const results = pickRaResults([
      award(13, "Patreon Supporter", "2026-01-01T00:00:00Z"),
    ]);

    expect(results.size).toBe(0);
  });
});

describe("pickGamesForSets", () => {
  const games = [
    {
      _id: "expanded",
      ratingsCount: 2,
      retroachievements: [{ gameId: 10067 }],
    },
    {
      _id: "original",
      ratingsCount: 9,
      retroachievements: [{ gameId: 10067 }],
    },
  ];

  it("gives a set shared by two games to the one the user played", () => {
    const picked = pickGamesForSets(
      games,
      [10067],
      new Set(["expanded"]),
      new Set()
    );

    expect(picked.get(10067)?._id).toBe("expanded");
  });

  it("falls back to the game the user rated, then to the most rated one", () => {
    expect(
      pickGamesForSets(games, [10067], new Set(), new Set(["expanded"])).get(
        10067
      )?._id
    ).toBe("expanded");
    expect(
      pickGamesForSets(games, [10067], new Set(), new Set()).get(10067)?._id
    ).toBe("original");
  });
});
