import {
  getSearchNames,
  getSearchRelevanceTier,
} from "./services/games.service";

const tier = (name: string) => getSearchRelevanceTier("eden", name);

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

  it("puts subsequence-only matches last", () => {
    expect(tier("elden ring")).toBe(4);
  });
});

describe("getSearchNames", () => {
  it("indexes the name, its arabic numerals variant and the alternative names", () => {
    expect(
      getSearchNames({
        name: "The Witcher 3: Wild Hunt",
        alternative_names: [
          "Witcher III",
          "Ведьмак 3: Дикая охота",
          "ウィッチャー３　ワイルドハント",
          "WITCHER III",
        ],
      })
    ).toEqual([
      "the witcher 3 wild hunt",
      "witcher iii",
      "witcher 3",
      "ведьмак 3 дикая охота",
      "ウィッチャー3 ワイルトハント",
    ]);
  });

  it("drops names that normalise to nothing", () => {
    expect(getSearchNames({ name: "***", alternative_names: null })).toEqual(
      []
    );
  });

  it("folds diacritics and ё", () => {
    expect(
      getSearchNames({ name: "Pokémon", alternative_names: ["Ёжик"] })
    ).toEqual(["pokemon", "ежик"]);
  });
});
