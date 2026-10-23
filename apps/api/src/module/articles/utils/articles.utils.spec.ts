import {
  buildArticleArchive,
  countReadingMinutes,
  getPublishedRange,
  slugifyArticleTitle,
} from "./articles.utils";

describe("slugifyArticleTitle", () => {
  it("keeps latin words and drops punctuation and accents", () => {
    expect(
      slugifyArticleTitle("Silksong a year later: how far players got!")
    ).toBe("silksong-a-year-later-how-far-players-got");
    expect(slugifyArticleTitle("Pokémon & Café")).toBe("pokemon-and-cafe");
  });

  it("falls back to a placeholder for a title without latin letters", () => {
    expect(slugifyArticleTitle("Новости")).toBe("post");
  });
});

describe("countReadingMinutes", () => {
  it("counts the words of the text, not the markup", () => {
    const words = Array.from({ length: 401 }, () => "word").join(" ");

    expect(countReadingMinutes(`<p>${words}</p>`)).toBe(3);
    expect(countReadingMinutes("<p></p>")).toBe(1);
  });
});

describe("getPublishedRange", () => {
  it("covers a whole month or a whole year in UTC", () => {
    expect(getPublishedRange(2026, 9)).toEqual({
      $gte: new Date("2026-09-01T00:00:00.000Z"),
      $lt: new Date("2026-10-01T00:00:00.000Z"),
    });
    expect(getPublishedRange(2026, 12).$lt).toEqual(
      new Date("2027-01-01T00:00:00.000Z")
    );
    expect(getPublishedRange(2025)).toEqual({
      $gte: new Date("2025-01-01T00:00:00.000Z"),
      $lt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });
});

describe("buildArticleArchive", () => {
  it("groups months into years, newest first, and sums the counts", () => {
    expect(
      buildArticleArchive([
        { year: 2025, month: 11, count: 2 },
        { year: 2026, month: 9, count: 3 },
        { year: 2026, month: 10, count: 4 },
      ])
    ).toEqual({
      total: 9,
      years: [
        {
          year: 2026,
          count: 7,
          months: [
            { month: 10, count: 4 },
            { month: 9, count: 3 },
          ],
        },
        { year: 2025, count: 2, months: [{ month: 11, count: 2 }] },
      ],
    });
  });
});
