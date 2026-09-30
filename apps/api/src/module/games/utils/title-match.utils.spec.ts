import { descriptionOverlap, descriptionTokens } from "./title-match.utils";

describe("descriptionTokens", () => {
  const vnDescription =
    "A playable visual novel version of Mass Effect 3 as predicted by me before the actual game came out. See new location(s)! Meet new character(s)! Romance aliens of at least two genders! Just as good as the real thing(*), and absolutely free!";
  const gameSummary =
    "Mass Effect 3 is an action role-playing game in which the player controls Commander Shepard, who must unite the galaxy to stop the Reapers, an ancient race of sentient machines invading Earth.";

  it("matches unrelated descriptions only through the shared title", () => {
    expect(
      descriptionOverlap(
        descriptionTokens(vnDescription),
        descriptionTokens(gameSummary)
      )
    ).toBeGreaterThan(0);
  });

  it("drops the excluded title words from both sides", () => {
    const titleTokens = descriptionTokens("Mass Effect 3");

    expect(
      descriptionOverlap(
        descriptionTokens(vnDescription, titleTokens),
        descriptionTokens(gameSummary, titleTokens)
      )
    ).toBe(0);
  });
});
