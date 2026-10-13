import {
  buildHltbCatalog,
  findCatalogCandidates,
  findHltbConflict,
  isSameHltb,
  mapRawHltbEntry,
  buildHltbSearchQueries,
  buildPlatformKeySet,
  canonicalPlatform,
  hasHltbTimes,
  HltbMatchContext,
  mapHltbEntryToField,
  normalizeHltbTitle,
  pickBestHltbMatch,
  selectHltbMatch,
} from "./hltb.utils";
import { normalizeCoreTitle, titleSimilarity } from "./title-match.utils";

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
      expect(
        normalizeCoreTitle("Final Fantasy: 20th Anniversary Edition")
      ).toBe("final fantasy");
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

    it("accepts an exact title on a shared platform that HLTB dates a few years earlier", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 46226,
            name: "Tekken 7",
            platforms: ["PC", "PlayStation 4", "Xbox One"],
            releaseYear: 2015,
          },
        ],
        ctx({
          name: "Tekken 7",
          platformKeys: buildPlatformKeySet(["PC (Microsoft Windows)"]),
          years: new Set([2017]),
        })
      );

      expect(result?.id).toBe(46226);
    });

    it("sends an exact title three years off to review instead of matching it", () => {
      const entries = [
        {
          id: 120442,
          name: "Final Fantasy XIV",
          alias: "Final Fantasy XIV Online, Final Fantasy XIV 1.0",
          platforms: ["PC", "PlayStation 3"],
          releaseYear: 2010,
          mainTime: 14400,
        },
      ];
      const game = ctx({
        name: "Final Fantasy XIV Online",
        platformKeys: buildPlatformKeySet(["PC (Microsoft Windows)"]),
        years: new Set([2013]),
      });

      expect(pickBestHltbMatch(entries, game)).toBeNull();
      expect(findHltbConflict(entries, game)?.reason).toBe("unverified-title");
    });

    it("lists the strong title before loose ones that match the year", () => {
      const conflict = findHltbConflict(
        [
          {
            id: 7029,
            name: "Phoenix Wright: Ace Attorney - Trials and Tribulations",
            platforms: ["Nintendo DS"],
            releaseYear: 2004,
            mainTime: 3600,
          },
          {
            id: 7026,
            name: "Phoenix Wright: Ace Attorney",
            platforms: ["Nintendo DS"],
            releaseYear: 2001,
            mainTime: 3600,
          },
        ],
        ctx({
          name: "Phoenix Wright: Ace Attorney",
          platformKeys: buildPlatformKeySet(["Nintendo DS"]),
          years: new Set([2005]),
        })
      );

      expect(conflict?.entries.map(({ id }) => id)).toEqual([7026, 7029]);
    });

    it("keeps the year veto for a shared title and platform years apart", () => {
      const result = pickBestHltbMatch(
        [
          {
            id: 123997,
            name: "RuneScape",
            alias: "Old School RuneScape",
            platforms: ["PC"],
            releaseYear: 2001,
          },
        ],
        ctx({
          name: "Old School RuneScape",
          platformKeys: buildPlatformKeySet(["PC (Microsoft Windows)"]),
          years: new Set([2013]),
        })
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
      const queries = buildHltbSearchQueries(
        "Hitman: Game of the Year Edition"
      );

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

    it("counts co-op and multiplayer times for games HLTB lists without a single-player block", () => {
      expect(
        hasHltbTimes({
          hltbId: "80199",
          coop: 14.2,
          multiplayer: 2.3,
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
});

describe("findHltbConflict", () => {
  const ctx = {
    name: "The Incredible Hulk",
    platformKeys: new Set<string>(),
    years: new Set([2008]),
  };
  const timed = { mainTime: 3600 };
  const ids = (conflict: { entries: { id: number }[] } | null) =>
    conflict?.entries.map(({ id }) => id);

  it("offers every same-title entry the rules could not tell apart", () => {
    const conflict = findHltbConflict(
      [
        { id: 1, name: "The Incredible Hulk", releaseYear: 2008, ...timed },
        { id: 2, name: "The Incredible Hulk", releaseYear: 2008, ...timed },
        { id: 3, name: "Hulk", releaseYear: 2003, ...timed },
      ],
      ctx
    );

    expect(conflict?.reason).toBe("competing-candidates");
    expect(ids(conflict)).toEqual([1, 2]);
  });

  it("offers an entry with a different release year after the matching ones", () => {
    const conflict = findHltbConflict(
      [
        { id: 4, name: "The Incredible Hulk", releaseYear: 1994, ...timed },
        { id: 1, name: "The Incredible Hulk", releaseYear: 2008, ...timed },
      ],
      ctx
    );

    expect(ids(conflict)).toEqual([1, 4]);
  });

  it("leaves out entries without times, which cannot be applied", () => {
    const conflict = findHltbConflict(
      [
        { id: 1, name: "The Incredible Hulk", releaseYear: 2008 },
        { id: 2, name: "The Incredible Hulk", releaseYear: 1994, ...timed },
      ],
      ctx
    );

    expect(conflict?.reason).toBe("unverified-title");
    expect(ids(conflict)).toEqual([2]);
  });

  it("offers a loosely titled entry that shares the platform and the year", () => {
    const conflict = findHltbConflict(
      [
        {
          id: 13937,
          name: "Pokémon X and Y",
          platforms: ["Nintendo 3DS"],
          releaseYear: 2013,
          ...timed,
        },
        {
          id: 130008,
          name: "Pokemon Eternal X",
          platforms: ["Nintendo 3DS"],
          releaseYear: 0,
          ...timed,
        },
      ],
      {
        name: "Pokémon X",
        platformKeys: buildPlatformKeySet(["Nintendo 3DS"]),
        years: new Set([2013]),
      }
    );

    expect(conflict?.reason).toBe("weak-title");
    expect(ids(conflict)).toEqual([13937]);
  });

  it("does not offer another numbered entry of a series", () => {
    const conflict = findHltbConflict(
      [
        {
          id: 162424,
          name: "Hidden World 9 Top-Down 3D",
          platforms: ["PC"],
          releaseYear: 2023,
          ...timed,
        },
      ],
      {
        name: "Hidden World 7 Top-Down 3D",
        platformKeys: buildPlatformKeySet(["PC (Microsoft Windows)"]),
        years: new Set([2023]),
      }
    );

    expect(conflict).toBeNull();
  });

  it("does not offer a loose title without platform and year corroboration", () => {
    const conflict = findHltbConflict(
      [{ id: 22640, name: "Randal's Monday", releaseYear: 2014, ...timed }],
      { name: "Monday", platformKeys: new Set(), years: new Set() }
    );

    expect(conflict).toBeNull();
  });
});

describe("HLTB title comparison", () => {
  it("treats Roman and Arabic numerals as the same title", () => {
    const match = selectHltbMatch(
      [
        {
          id: 68033,
          name: "Baldur's Gate 3",
          releaseYear: 2023,
          platforms: ["PC"],
        },
      ],
      {
        name: "Baldur's Gate III",
        platformKeys: new Set(["pc"]),
        years: new Set([2023]),
      }
    );

    expect(match?.entry.id).toBe(68033);
  });

  it("matches the game against the entry's alternative name", () => {
    const match = selectHltbMatch(
      [
        {
          id: 1,
          name: "Biohazard 4",
          alias: "Resident Evil 4",
          releaseYear: 2005,
          platforms: ["GameCube"],
        },
      ],
      {
        name: "Resident Evil 4",
        platformKeys: new Set(["gamecube"]),
        years: new Set([2005]),
      }
    );

    expect(match?.entry.id).toBe(1);
  });

  it("keeps a single-letter X as a word, not a numeral", () => {
    expect(normalizeHltbTitle("Mega Man X")).toBe("mega man x");
    expect(normalizeHltbTitle("Final Fantasy VII")).toBe("final fantasy 7");
  });
});

describe("HLTB catalogue", () => {
  const raw = (overrides: Record<string, unknown> = {}) =>
    ({
      game_id: 80199,
      game_name: "It Takes Two",
      game_alias: "It Takes 2",
      game_type: "multi",
      game_image: "80199_It_Takes_Two.jpg",
      comp_lvl_sp: 0,
      comp_lvl_co: 1,
      comp_lvl_mp: 1,
      comp_main: 46231,
      comp_plus: 51172,
      comp_100: 59318,
      comp_all: 50940,
      comp_main_count: 1786,
      comp_plus_count: 1690,
      comp_100_count: 781,
      comp_all_count: 4257,
      invested_co: 51101,
      invested_mp: 8273,
      invested_co_count: 807,
      invested_mp_count: 4,
      review_score: 88,
      profile_platform: "PC, PlayStation 5",
      profile_popular: 526,
      release_world: 2021,
      ...overrides,
    }) as never;

  it("hides the single-player times HLTB hides, as its own pages do", () => {
    const entry = mapRawHltbEntry(raw());

    expect(entry.mainTime).toBeUndefined();
    expect(entry.coopTime).toBe(51101);
    expect(entry.multiplayerTime).toBe(8273);
    expect(entry.platforms).toEqual(["PC", "PlayStation 5"]);
    expect(entry.imageUrl).toBe(
      "https://howlongtobeat.com/games/80199_It_Takes_Two.jpg"
    );
  });

  const entry = (id: number, name: string, popularity = 0, alias = "") => ({
    id,
    name,
    alias,
    popularity,
  });

  it("finds entries holding every query word, in the name or the alias", () => {
    const catalog = buildHltbCatalog([
      entry(1, "Baldur's Gate 3", 10, "Baldur's Gate III"),
      entry(2, "Baldur's Gate", 5),
      entry(3, "Gate of Doom", 1),
    ]);

    expect(
      findCatalogCandidates(catalog, "Baldur's Gate III").map(({ id }) => id)
    ).toEqual([1]);
  });

  it("keeps HLTB's first page: the most popular 20 entries of a query", () => {
    const catalog = buildHltbCatalog(
      Array.from({ length: 30 }, (_, i) =>
        entry(i + 1, `Hidden Object ${i + 1}`, i)
      )
    );

    const ids = findCatalogCandidates(catalog, "Hidden Object").map(
      ({ id }) => id
    );

    expect(ids).toHaveLength(20);
    expect(ids).toContain(30);
    expect(ids).not.toContain(1);
  });

  it("scores each entry against the query that found it", () => {
    const catalog = buildHltbCatalog([
      entry(1, "Run"),
      entry(2, "Run Run Run Away From the Haunted Castle"),
    ]);

    const found = findCatalogCandidates(catalog, "Run");

    expect(found.find(({ id }) => id === 1)?.similarity).toBe(1);
    expect(found.find(({ id }) => id === 2)?.similarity).toBeLessThan(1);
  });

  it("treats a refreshed entry with the same times as unchanged", () => {
    const stored = mapHltbEntryToField({ id: 1, name: "A", mainTime: 3600 });
    const fresh = {
      ...stored,
      updatedAt: "2030-01-01T00:00:00.000Z",
      similarity: 0.7,
    };

    expect(isSameHltb(stored, fresh)).toBe(true);
    expect(isSameHltb(stored, { ...fresh, mainStory: 2 })).toBe(false);
  });
});
