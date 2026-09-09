import {
  buildHltbSearchQueries,
  buildIncrementalHltbFilter,
  buildMissingHltbFilter,
  buildPlatformKeySet,
  canonicalPlatform,
  hasHltbTimes,
  HltbMatchContext,
  mapHltbEntryToField,
  normalizeCoreTitle,
  pickBestHltbMatch,
  titleSimilarity,
} from "./hltb.utils";
import { HLTB_NOT_FOUND_RETRY_DAYS, HLTB_STALE_DAYS } from "../constants/hltb";

const ctx = (overrides: Partial<HltbMatchContext> = {}): HltbMatchContext => ({
  name: "Game",
  platformKeys: new Set(),
  years: new Set(),
  ...overrides,
});

describe("hltb.utils", () => {
  describe("titleSimilarity", () => {
    it("is 1 for identical titles regardless of word order", () => {
      expect(
        titleSimilarity(
          "Super Mario World: Super Mario Advance 2",
          "Super Mario Advance 2: Super Mario World"
        )
      ).toBe(1);
    });

    it("is low for titles that only share a generic prefix", () => {
      expect(
        titleSimilarity("Shin Megami Tensei", "Shin Megami Tensei V")
      ).toBeLessThan(0.85);
    });
  });

  describe("canonicalPlatform", () => {
    it("maps Super Famicom and Super Nintendo to the same key", () => {
      expect(canonicalPlatform("Super Famicom")).toBe(
        canonicalPlatform("Super Nintendo")
      );
    });

    it("maps PC (Microsoft Windows) and DOS onto PC", () => {
      expect(canonicalPlatform("PC (Microsoft Windows)")).toBe("pc");
      expect(canonicalPlatform("DOS")).toBe("pc");
    });

    it("normalizes separators so 'X|S' and 'X/S' agree", () => {
      expect(canonicalPlatform("Xbox Series X|S")).toBe(
        canonicalPlatform("Xbox Series X/S")
      );
    });
  });

  describe("normalizeCoreTitle", () => {
    it("strips edition/version markers", () => {
      expect(normalizeCoreTitle("Final Fantasy: 20th Anniversary Edition")).toBe(
        "final fantasy"
      );
      expect(normalizeCoreTitle("The Last of Us: Remastered")).toBe(
        "the last of us"
      );
    });

    it("strips platform-specific edition suffixes", () => {
      expect(normalizeCoreTitle("Resident Evil 4: Wii Edition")).toBe(
        "resident evil 4"
      );
    });

    it("strips remaster/redux/hd and director's cut markers", () => {
      expect(normalizeCoreTitle("Darksiders: Warmastered Edition")).toBe(
        "darksiders"
      );
      expect(normalizeCoreTitle("The Vanishing of Ethan Carter Redux")).toBe(
        "the vanishing of ethan carter"
      );
      expect(normalizeCoreTitle("Ōkami HD")).toBe("okami");
      expect(normalizeCoreTitle("Sonic Adventure DX: Director's Cut")).toBe(
        "sonic adventure dx"
      );
      expect(normalizeCoreTitle("Hitman: Game of the Year Edition")).toBe(
        "hitman"
      );
    });

    it("does NOT strip a sequel ordinal mislabeled as an edition", () => {
      // "Fourth Edition" here denotes The Settlers IV, not a re-release.
      expect(normalizeCoreTitle("The Settlers: Fourth Edition")).toBe(
        "the settlers fourth edition"
      );
    });

    it("leaves plain titles untouched", () => {
      expect(normalizeCoreTitle("Final Fantasy III")).toBe("final fantasy iii");
    });
  });

  describe("canonicalPlatform (mobile)", () => {
    it("collapses iOS / Android / Windows Phone onto HLTB's 'Mobile'", () => {
      expect(canonicalPlatform("iOS")).toBe("mobile");
      expect(canonicalPlatform("Android")).toBe("mobile");
      expect(canonicalPlatform("Windows Phone")).toBe("mobile");
      expect(canonicalPlatform("Mobile")).toBe("mobile");
    });
  });

  describe("pickBestHltbMatch", () => {
    it("matches a re-release to its base entry when corroborated by platform", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 3480,
            name: "Final Fantasy",
            platforms: ["NES", "PlayStation Portable", "Nintendo 3DS"],
            releaseYear: 1987,
            similarity: 1,
          },
          {
            id: 3499,
            name: "Final Fantasy IV",
            platforms: ["PlayStation Portable", "Super Nintendo"],
            releaseYear: 1991,
            similarity: 0.81,
          },
        ],
        ctx({
          name: "Final Fantasy: 20th Anniversary Edition",
          platformKeys: buildPlatformKeySet(["PlayStation Portable", "iOS"]),
          years: new Set([2007]),
        })
      );

      expect(result?.id).toBe(3480);
    });

    it("matches a DLC whose HLTB entry carries a trailing 'DLC' token", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 23639,
            name: "Assassin's Creed: Unity - Dead Kings DLC",
            platforms: ["PC", "PlayStation 4", "Xbox One"],
            releaseYear: 2015,
            similarity: 0.83,
          },
        ],
        ctx({
          name: "Assassin's Creed Unity: Dead Kings",
          platformKeys: buildPlatformKeySet([
            "Xbox One",
            "PC (Microsoft Windows)",
            "PlayStation 4",
          ]),
          years: new Set([2015]),
        })
      );

      expect(result?.id).toBe(23639);
    });

    it("uses platform overlap to pick the right entry among same-named games", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 94537,
            name: "Final Fantasy III",
            platforms: ["NES", "PC"],
            releaseYear: 1990,
            similarity: 1,
          },
          {
            id: 3497,
            name: "Final Fantasy III",
            platforms: ["Nintendo DS", "PlayStation Portable"],
            releaseYear: 2006,
            similarity: 1,
          },
        ],
        ctx({
          name: "Final Fantasy III",
          platformKeys: buildPlatformKeySet(["PlayStation Portable"]),
          years: new Set([2006, 2012]),
        })
      );

      expect(result?.id).toBe(3497);
    });

    it("rejects a same-title, same-platform entry from a different year", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 700003,
            name: "Mixtape",
            platforms: ["PC", "Xbox Series X/S"],
            releaseYear: 2018,
            similarity: 1,
          },
        ],
        ctx({
          name: "Mixtape",
          platformKeys: buildPlatformKeySet([
            "PC (Microsoft Windows)",
            "Xbox Series X|S",
          ]),
          years: new Set([2026]),
        })
      );

      expect(result).toBeNull();
    });


    it("confirms an exact title corroborated by platform overlap", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 9367,
            name: "Super Mario Advance 2: Super Mario World",
            platforms: ["Game Boy Advance"],
            releaseYear: 2001,
            similarity: 0.5,
          },
        ],
        ctx({
          name: "Super Mario World: Super Mario Advance 2",
          platformKeys: buildPlatformKeySet(["Wii U", "Game Boy Advance"]),
          years: new Set([2002]),
        })
      );

      expect(result?.id).toBe(9367);
    });

    it("disambiguates a series by release year + platform", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 8420,
            name: "Shin Megami Tensei",
            platforms: ["Super Nintendo", "PlayStation"],
            releaseYear: 1992,
            similarity: 1,
          },
          {
            id: 8426,
            name: "Shin Megami Tensei IV",
            platforms: ["Nintendo 3DS"],
            releaseYear: 2013,
            similarity: 0.9,
          },
          {
            id: 53769,
            name: "Shin Megami Tensei V",
            platforms: ["Nintendo Switch"],
            releaseYear: 2021,
            similarity: 0.9,
          },
        ],
        ctx({
          name: "Shin Megami Tensei",
          platformKeys: buildPlatformKeySet(["Super Famicom", "Wii"]),
          years: new Set([1992, 2007]),
        })
      );

      expect(result?.id).toBe(8420);
    });

    it("skips when several entries share the title and none can be confirmed", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 9948,
            name: "The Incredible Hulk",
            platforms: ["Super Nintendo", "Sega Mega Drive/Genesis"],
            releaseYear: 1993,
            similarity: 1,
          },
          {
            id: 89054,
            name: "The Incredible Hulk",
            platforms: ["Game Boy Advance"],
            releaseYear: 2003,
            similarity: 1,
          },
          {
            id: 9949,
            name: "The Incredible Hulk",
            platforms: ["PlayStation 3", "Wii"],
            releaseYear: 2008,
            similarity: 1,
          },
        ],
        ctx({
          name: "The Incredible Hulk",
          platformKeys: buildPlatformKeySet(["Atari 2600"]),
          years: new Set(),
        })
      );

      expect(result).toBeNull();
    });

    it("rejects a unique exact title whose release year conflicts with ours", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 700001,
            name: "Mixtape",
            releaseYear: 2018,
            similarity: 1,
          },
        ],
        ctx({ name: "Mixtape", years: new Set([2026]) })
      );

      expect(result).toBeNull();
    });

    it("accepts a unique exact title when the years line up", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 700002,
            name: "Mixtape",
            releaseYear: 2018,
            similarity: 1,
          },
        ],
        ctx({ name: "Mixtape", years: new Set([2018]) })
      );

      expect(result?.id).toBe(700002);
    });

    it("accepts a unique exact title even without corroboration", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 50419,
            name: "Nioh: Complete Edition",
            similarity: 0.2,
          },
          {
            id: 36936,
            name: "Nioh",
            similarity: 1,
          },
        ],
        ctx({ name: "Nioh" })
      );

      expect(result?.id).toBe(36936);
    });

    it("returns null when nothing matches the title", () => {
      const result = pickBestHltbMatch(
        [{ id: 1, name: "Unrelated Game", similarity: 0.1 }],
        ctx({ name: "Elden Ring" })
      );

      expect(result).toBeNull();
    });
  });

  describe("buildHltbSearchQueries", () => {
    it("returns just the full name when there are no subtitles", () => {
      expect(buildHltbSearchQueries("Shin Megami Tensei")).toEqual([
        "Shin Megami Tensei",
      ]);
    });

    it("adds subtitle parts and a reversed variant for colon titles", () => {
      const queries = buildHltbSearchQueries(
        "Super Mario World: Super Mario Advance 2"
      );

      expect(queries).toContain("Super Mario World: Super Mario Advance 2");
      expect(queries).toContain("Super Mario Advance 2");
      expect(queries).toContain("Super Mario Advance 2 Super Mario World");
    });

    it("includes the edition-stripped core as a query", () => {
      const queries = buildHltbSearchQueries("Hitman: Game of the Year Edition");

      expect(queries).toContain("hitman");
    });
  });

  describe("mapHltbEntryToField", () => {
    it("maps HLTB entry fields to stored schema", () => {
      const mapped = mapHltbEntryToField({
        id: 36936,
        name: "Nioh",
        mainTime: 34.5 * 3600,
        mainExtraTime: 61 * 3600,
        completionistTime: 93.5 * 3600,
      });

      expect(mapped).toEqual({
        hltbId: "36936",
        mainStory: 34.5,
        mainExtra: 61,
        completionist: 93.5,
        allStyles: null,
        coop: null,
        multiplayer: null,
        mainStoryCount: null,
        mainExtraCount: null,
        completionistCount: null,
        allStylesCount: null,
        coopCount: null,
        multiplayerCount: null,
        reviewScore: null,
        imageUrl: null,
        platforms: [],
        releaseYear: null,
        similarity: null,
        alias: null,
        type: null,
        sourceName: "Nioh",
        updatedAt: expect.any(String),
      });
    });

    it("normalizes non-positive values to null", () => {
      const mapped = mapHltbEntryToField({
        id: 1,
        name: "Test",
        mainTime: 0,
        mainExtraTime: -1,
        completionistTime: 10 * 3600,
      });

      expect(mapped.mainStory).toBeNull();
      expect(mapped.mainExtra).toBeNull();
      expect(mapped.completionist).toBe(10);
    });
  });

  describe("hasHltbTimes", () => {
    it("returns true when at least one time exists", () => {
      expect(
        hasHltbTimes({
          hltbId: "1",
          mainStory: 10,
          updatedAt: "2026-01-01T00:00:00.000Z",
        })
      ).toBe(true);
    });

    it("returns false when all times are missing", () => {
      expect(
        hasHltbTimes({
          hltbId: "1",
          mainStory: null,
          mainExtra: null,
          completionist: null,
          updatedAt: "2026-01-01T00:00:00.000Z",
        })
      ).toBe(false);
    });
  });

  describe("buildIncrementalHltbFilter", () => {
    it("includes stale records and untried games missing the marker", () => {
      const now = Date.parse("2026-06-21T00:00:00.000Z");
      const filter = buildIncrementalHltbFilter(HLTB_STALE_DAYS, now);

      expect(filter).toEqual({
        $or: [
          {
            $and: [
              {
                $or: [
                  { hltb: { $exists: false } },
                  { "hltb.updatedAt": { $exists: false } },
                  {
                    $and: [
                      {
                        $or: [
                          { "hltb.mainStory": { $exists: false } },
                          { "hltb.mainStory": null },
                        ],
                      },
                      {
                        $or: [
                          { "hltb.mainExtra": { $exists: false } },
                          { "hltb.mainExtra": null },
                        ],
                      },
                      {
                        $or: [
                          { "hltb.completionist": { $exists: false } },
                          { "hltb.completionist": null },
                        ],
                      },
                    ],
                  },
                ],
              },
              { hltbNotFoundAt: { $exists: false } },
            ],
          },
          { "hltb.updatedAt": { $lt: "2026-05-22T00:00:00.000Z" } },
          { hltbNotFoundAt: { $lt: "2026-03-23T00:00:00.000Z" } },
        ],
      });
    });

    it("re-checks not-found games older than the retry window", () => {
      const now = Date.parse("2026-06-21T00:00:00.000Z");
      const filter = buildIncrementalHltbFilter(
        HLTB_STALE_DAYS,
        now,
        HLTB_NOT_FOUND_RETRY_DAYS
      );

      expect(filter.$or).toContainEqual({
        hltbNotFoundAt: { $lt: "2026-03-23T00:00:00.000Z" },
      });
    });
  });

  describe("buildMissingHltbFilter", () => {
    it("matches games without hltb data and excludes marked not-found games", () => {
      expect(buildMissingHltbFilter()).toEqual({
        $and: [
          {
            $or: [
              { hltb: { $exists: false } },
              {
                $and: [
                  {
                    $or: [
                      { "hltb.mainStory": { $exists: false } },
                      { "hltb.mainStory": null },
                    ],
                  },
                  {
                    $or: [
                      { "hltb.mainExtra": { $exists: false } },
                      { "hltb.mainExtra": null },
                    ],
                  },
                  {
                    $or: [
                      { "hltb.completionist": { $exists: false } },
                      { "hltb.completionist": null },
                    ],
                  },
                ],
              },
            ],
          },
          { hltbNotFoundAt: { $exists: false } },
        ],
      });
    });
  });
});
