import {
  countSchemaAchievements,
  getSteamAppId,
} from "./steam-achievements.service";

describe("countSchemaAchievements", () => {
  it("counts the achievements of a game that has them", () => {
    expect(
      countSchemaAchievements({
        game: { availableGameStats: { achievements: [{}, {}, {}] } },
      })
    ).toBe(3);
  });

  it("reads a game without stats as zero", () => {
    expect(countSchemaAchievements({ game: {} })).toBe(0);
    expect(countSchemaAchievements({})).toBe(0);
  });
});

describe("getSteamAppId", () => {
  it("takes the numeric uid of the Steam page", () => {
    expect(
      getSteamAppId({
        externalPages: [
          { name: "GOG", uid: "abc" },
          { name: "Steam", uid: "620" },
        ],
      })
    ).toBe(620);
  });

  it("ignores a Steam page without a numeric id", () => {
    expect(
      getSteamAppId({ externalPages: [{ name: "Steam", uid: "portal-2" }] })
    ).toBeNull();
  });
});
