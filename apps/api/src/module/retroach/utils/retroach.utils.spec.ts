import {
  matchGameByTitle,
  matchPlatformToConsole,
  matchRaSets,
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

describe("matchRaSets", () => {
  const NES = "nes-platform";
  const set = (id: number, title: string) => ({
    id,
    title,
    consoleId: 7,
    consoleName: "NES/Famicom",
    numAchievements: 20,
  });
  const game = (id: string, name: string, extra: object = {}) => ({
    _id: id,
    name,
    platformIds: [NES],
    ...extra,
  });
  const run = (
    raGames: ReturnType<typeof set>[],
    games: ReturnType<typeof game>[],
    resolutions = new Map<string, { status: string; winners: string[] }>()
  ) =>
    matchRaSets({
      raGames,
      games,
      platforms: [{ _id: NES, raId: 7 }],
      resolutions,
    });
  const linked = (result: ReturnType<typeof run>) =>
    Object.fromEntries(
      Object.entries(result.gameIds).map(([id, sets]) => [
        id,
        sets.map(({ gameId }) => gameId),
      ])
    );

  it("links a set to the best title on its console", () => {
    const result = run(
      [set(1, "Mega Man 2")],
      [game("a", "Mega Man 2"), game("b", "Bomberman")]
    );

    expect(linked(result)).toEqual({ a: [1] });
    expect(result.ambiguous).toEqual([]);
  });

  it("lets an exact title break a near tie, and sends a tie without one to review", () => {
    const tied = [game("a", "Contra Force"), game("b", "Contra Forces")];

    expect(linked(run([set(1, "Contra Force")], tied))).toEqual({ a: [1] });
    expect(
      run([set(2, "Contra For")], tied).ambiguous.map(({ raGame }) => raGame.id)
    ).toEqual([2]);
  });

  it("follows a resolved conflict and skips a pending one", () => {
    const result = run(
      [set(1, "Mega Man 2"), set(2, "Bomberman")],
      [game("a", "Mega Man 2"), game("b", "Bomberman")],
      new Map([
        ["1", { status: "resolved", winners: ["b"] }],
        ["2", { status: "pending", winners: [] }],
      ])
    );

    expect(linked(result)).toEqual({ b: [1] });
  });

  it("keeps a pinned set on its game when RA did not list it this run", () => {
    const result = run(
      [set(1, "Mega Man 2")],
      [
        game("a", "Mega Man 2", {
          retroachievements: [{ gameId: 9, consoleId: 7 }],
        }),
      ],
      new Map([["9", { status: "resolved", winners: ["a"] }]])
    );

    expect(linked(result)).toEqual({ a: [1, 9] });
  });
});
