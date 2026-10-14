import {
  descriptionOverlap,
  descriptionTokens,
  normalizeTitleWithNumerals,
  replaceRomanNumerals,
} from "./title-match.utils";

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

describe("replaceRomanNumerals", () => {
  it("replaces standalone roman numerals with arabic ones", () => {
    expect(replaceRomanNumerals("warcraft iii reign of chaos")).toBe(
      "warcraft 3 reign of chaos"
    );
    expect(replaceRomanNumerals("final fantasy xiv")).toBe("final fantasy 14");
    expect(replaceRomanNumerals("grand theft auto v")).toBe(
      "grand theft auto 5"
    );
    expect(replaceRomanNumerals("rome mcmxcix")).toBe("rome 1999");
  });

  it("leaves words and invalid numerals untouched", () => {
    expect(replaceRomanNumerals("diablo")).toBe("diablo");
    expect(replaceRomanNumerals("iiii vx")).toBe("iiii vx");
    expect(replaceRomanNumerals("warcraft 3")).toBe("warcraft 3");
  });
});

describe("normalizeTitleWithNumerals", () => {
  it("folds numerals from II to XX and keeps single letters as words", () => {
    const folded = [
      "ii",
      "iii",
      "iv",
      "vi",
      "vii",
      "viii",
      "ix",
      "xi",
      "xii",
      "xiii",
      "xiv",
      "xv",
      "xvi",
      "xvii",
      "xviii",
      "xix",
      "xx",
    ].map((numeral) => normalizeTitleWithNumerals(`Saga ${numeral}`));

    expect(folded).toEqual(
      [2, 3, 4, 6, 7, 8, 9, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(
        (value) => `saga ${value}`
      )
    );
    expect(normalizeTitleWithNumerals("Mega Man X")).toBe("mega man x");
    expect(normalizeTitleWithNumerals("Final Fantasy VII")).toBe(
      "final fantasy 7"
    );
    expect(normalizeTitleWithNumerals("Mix Civ XXI DC")).toBe("mix civ xxi dc");
  });
});
