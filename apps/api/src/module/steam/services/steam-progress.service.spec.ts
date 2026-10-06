import { readLastUnlock, readTopAchievements } from "./steam-progress.service";

describe("readTopAchievements", () => {
  it("reads the total and the unlocked count of every app", () => {
    expect(
      readTopAchievements({
        response: {
          games: [
            { appid: 620, total_achievements: 51, achievements: [{}, {}] },
            { appid: 400, total_achievements: 15 },
            { appid: 10 },
          ],
        },
      })
    ).toEqual([
      { appId: 620, total: 51, unlocked: 2 },
      { appId: 400, total: 15, unlocked: 0 },
      { appId: 10, total: 0, unlocked: 0 },
    ]);
  });
});

describe("readLastUnlock", () => {
  it("takes the latest unlock time of the achieved ones", () => {
    expect(
      readLastUnlock({
        playerstats: {
          achievements: [
            { achieved: 1, unlocktime: 1700000000 },
            { achieved: 1, unlocktime: 1710000000 },
            { achieved: 0, unlocktime: 1720000000 },
          ],
        },
      })
    ).toBe(new Date(1710000000 * 1000).toISOString());
  });

  it("returns null without unlocked achievements", () => {
    expect(readLastUnlock({ playerstats: {} })).toBeNull();
  });
});
