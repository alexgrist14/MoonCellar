import { getSearchRelevanceTier } from "./services/games.service";

const tier = (name: string, nameArabicNumerals?: string) =>
  getSearchRelevanceTier("eden", { nameNormalized: name, nameArabicNumerals });

describe("getSearchRelevanceTier", () => {
  it("ranks the exact name first", () => {
    expect(tier("eden")).toBe(0);
  });

  it("ranks a title starting with the word above one holding it later", () => {
    expect(tier("eden they were only two on the planet")).toBe(1);
    expect(tier("metal eden")).toBe(2);
    expect(tier("road to eden ii")).toBe(2);
  });

  it("ranks the query as a whole word above a longer word containing it", () => {
    expect(tier("edengrad")).toBe(3);
    expect(tier("edengrad")).toBeGreaterThan(tier("metal eden"));
  });

  it("matches the arabic numerals variant", () => {
    expect(
      getSearchRelevanceTier("eden 2", {
        nameNormalized: "eden ii",
        nameArabicNumerals: "eden 2",
      })
    ).toBe(0);
  });

  it("puts subsequence-only matches last", () => {
    expect(tier("elden ring")).toBe(4);
  });
});
