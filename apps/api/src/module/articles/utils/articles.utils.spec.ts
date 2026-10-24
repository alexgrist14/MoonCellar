import {
  buildArticleArchive,
  countReadingMinutes,
  getArticleVisitorKey,
  getPublishedRange,
  slugifyArticleTitle,
} from "./articles.utils";

const BROWSER =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0 Safari/537.36";

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

describe("getArticleVisitorKey", () => {
  it("keeps one key per signed-in user wherever they open the post from", () => {
    const first = getArticleVisitorKey({
      userId: "u1",
      ip: "10.0.0.1",
      userAgent: BROWSER,
    });

    expect(first).toMatch(/^[a-f\d]{64}$/);
    expect(
      getArticleVisitorKey({ userId: "u1", ip: "10.0.0.2", userAgent: BROWSER })
    ).toBe(first);
    expect(
      getArticleVisitorKey({ userId: "u2", ip: "10.0.0.1", userAgent: BROWSER })
    ).not.toBe(first);
  });

  it("tells guests apart by address and browser", () => {
    const guest = getArticleVisitorKey({ ip: "10.0.0.1", userAgent: BROWSER });

    expect(getArticleVisitorKey({ ip: "10.0.0.1", userAgent: BROWSER })).toBe(
      guest
    );
    expect(
      getArticleVisitorKey({ ip: "10.0.0.2", userAgent: BROWSER })
    ).not.toBe(guest);
    expect(
      getArticleVisitorKey({ ip: "10.0.0.1", userAgent: `${BROWSER} Edg/141` })
    ).not.toBe(guest);
  });

  it("counts no view for crawlers or a request without a browser", () => {
    expect(
      getArticleVisitorKey({
        ip: "66.249.66.1",
        userAgent:
          "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      })
    ).toBeNull();
    expect(
      getArticleVisitorKey({ ip: "10.0.0.1", userAgent: "curl/8.9.1" })
    ).toBeNull();
    expect(getArticleVisitorKey({ ip: "10.0.0.1" })).toBeNull();
  });
});
