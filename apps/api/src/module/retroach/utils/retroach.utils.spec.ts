import {
  matchGameByTitle,
  matchPlatformToConsole,
  pickExactTitleMatch,
  rankGamesByTitle,
} from "./retroach.utils";

describe("retroach.utils", () => {
  describe("matchGameByTitle", () => {
    it("matches an exact title", () => {
      const candidates = [
        { name: "The Witcher 3: Wild Hunt" },
        { name: "Cyberpunk 2077" },
      ];

      expect(matchGameByTitle("The Witcher 3: Wild Hunt", candidates)).toBe(
        candidates[0]
      );
    });

    it("tolerates minor typos", () => {
      const candidates = [{ name: "The Finals" }, { name: "Counter-Strike" }];

      expect(matchGameByTitle("The Fnals", candidates)).toBe(candidates[0]);
    });

    it("tries every '|' separated alt title and picks the best match", () => {
      const candidates = [{ name: "Dragon Quest" }, { name: "Final Fantasy" }];

      expect(matchGameByTitle("Dragon Warrior|Dragon Quest", candidates)).toBe(
        candidates[0]
      );
    });

    it("returns null when nothing clears the threshold", () => {
      const candidates = [{ name: "Super Mario Bros." }];

      expect(
        matchGameByTitle("Completely Unrelated Title", candidates)
      ).toBeNull();
    });

    it("returns null for an empty candidate list", () => {
      expect(matchGameByTitle("Anything", [])).toBeNull();
    });
  });

  describe("pickExactTitleMatch", () => {
    it("picks the only candidate whose title equals the RA title", () => {
      const candidates = [
        { name: "Dyna Brothers" },
        { name: "Dyna Brothers 2" },
      ];
      const ranked = rankGamesByTitle("Dyna Brothers", candidates);

      expect(ranked[0].score - ranked[1].score).toBeLessThan(0.05);
      expect(pickExactTitleMatch("Dyna Brothers", ranked)).toBe(candidates[0]);
    });

    it("leaves a shared set ambiguous when both titles match exactly", () => {
      const candidates = [
        { name: "Pokémon HeartGold Version" },
        { name: "Pokémon SoulSilver Version" },
      ];
      const title = "Pokémon HeartGold Version | Pokémon SoulSilver Version";

      expect(
        pickExactTitleMatch(title, rankGamesByTitle(title, candidates))
      ).toBeNull();
    });
  });

  describe("matchPlatformToConsole", () => {
    it("matches slash-separated names regardless of word order", () => {
      const consoles = [{ name: "Genesis/Mega Drive" }, { name: "Wii" }];

      expect(matchPlatformToConsole("Sega Mega Drive/Genesis", consoles)).toBe(
        consoles[0]
      );
    });

    it("does not confuse a platform with its numbered sequel", () => {
      const consoles = [{ name: "PlayStation" }, { name: "PlayStation 2" }];

      expect(matchPlatformToConsole("PlayStation 3", consoles)).toBeNull();
      expect(matchPlatformToConsole("PlayStation", consoles)).toBe(consoles[0]);
      expect(matchPlatformToConsole("PlayStation 2", consoles)).toBe(
        consoles[1]
      );
    });

    it("prefers the more specific shared segment", () => {
      const consoles = [
        { name: "PC Engine/TurboGrafx-16" },
        { name: "PC Engine CD/TurboGrafx-CD" },
      ];

      expect(
        matchPlatformToConsole("Turbografx-16/PC Engine CD", consoles)
      ).toBe(consoles[1]);
      expect(matchPlatformToConsole("TurboGrafx-16/PC Engine", consoles)).toBe(
        consoles[0]
      );
    });

    it("returns null when no exact segment is shared", () => {
      const consoles = [{ name: "Commodore 64" }];

      expect(
        matchPlatformToConsole("Commodore C64/128/MAX", consoles)
      ).toBeNull();
    });

    it("strips a known vendor prefix to match the bare platform name", () => {
      const consoles = [{ name: "Saturn" }, { name: "GameCube" }];

      expect(matchPlatformToConsole("Sega Saturn", consoles)).toBe(consoles[0]);
      expect(matchPlatformToConsole("Nintendo GameCube", consoles)).toBe(
        consoles[1]
      );
    });

    it("does not strip a vendor prefix down to a bare number", () => {
      const consoles = [{ name: "Nintendo 64" }];

      expect(matchPlatformToConsole("Dragon 32/64", consoles)).toBeNull();
      expect(matchPlatformToConsole("Nintendo 64", consoles)).toBe(consoles[0]);
    });

    it("matches a spelled-out platform name against its RA acronym", () => {
      const consoles = [{ name: "NES/Famicom" }];

      expect(
        matchPlatformToConsole("Nintendo Entertainment System", consoles)
      ).toBe(consoles[0]);
    });

    it("does not let a sequel's number leak into the acronym", () => {
      const consoles = [{ name: "PlayStation" }, { name: "PS" }];

      expect(matchPlatformToConsole("PlayStation 2", consoles)).toBeNull();
    });
  });
});

describe("rankGamesByTitle", () => {
  it("ranks every close candidate so a tie can be sent to review", () => {
    const candidates = [
      { name: "Tetris" },
      { name: "Tetris" },
      { name: "Tetris Attack" },
    ];
    const ranked = rankGamesByTitle("Tetris", candidates);

    expect(ranked.slice(0, 2).map(({ game }) => game)).toEqual([
      candidates[0],
      candidates[1],
    ]);
    expect(ranked[0].score - ranked[1].score).toBe(0);
  });

  it("takes the best score over all the RA title variants", () => {
    const candidates = [{ name: "Dragon Quest" }];

    expect(rankGamesByTitle("Dragon Warrior|Dragon Quest", candidates)).toEqual(
      [
        {
          game: candidates[0],
          score: expect.any(Number),
          matchedTitle: "Dragon Quest",
        },
      ]
    );
  });

  it("names the RA title each candidate matched", () => {
    const candidates = [
      { name: "Jennifer Capriati Tennis" },
      { name: "GrandSlam: The Tennis Tournament" },
    ];

    expect(
      rankGamesByTitle(
        "Jennifer Capriati Tennis | GrandSlam: The Tennis Tournament",
        candidates
      ).map(({ game, matchedTitle }) => [game.name, matchedTitle])
    ).toEqual(
      expect.arrayContaining([
        ["Jennifer Capriati Tennis", "Jennifer Capriati Tennis"],
        [
          "GrandSlam: The Tennis Tournament",
          "GrandSlam: The Tennis Tournament",
        ],
      ])
    );
  });
});
