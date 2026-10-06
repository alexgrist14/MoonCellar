import { gamesFilters } from "./games";

const HAS_RA = { "retroachievements.0": { $exists: true } };
const HAS_STEAM = { "steamAchievements.total": { $gt: 0 } };

const match = (filters: Parameters<typeof gamesFilters>[0]) =>
  gamesFilters(filters).$match;

describe("gamesFilters achievements", () => {
  it.each([
    ["ra", HAS_RA],
    ["steam", HAS_STEAM],
    ["both", { $and: [HAS_RA, HAS_STEAM] }],
    ["any", { $or: [HAS_RA, HAS_STEAM] }],
  ] as const)("%s", (achievements, condition) => {
    expect(match({ achievements })).toEqual({ $and: [condition] });
  });

  it("maps the deprecated toggles", () => {
    expect(match({ isOnlyWithAchievements: true })).toEqual({
      $and: [HAS_RA],
    });
    expect(
      match({ isOnlyWithAchievements: true, isOnlyWithSteamAchievements: true })
    ).toEqual({ $and: [{ $and: [HAS_RA, HAS_STEAM] }] });
  });

  it("prefers achievements over the deprecated toggles", () => {
    expect(
      match({ achievements: "steam", isOnlyWithAchievements: true })
    ).toEqual({ $and: [HAS_STEAM] });
  });

  it("adds nothing without a filter", () => {
    expect(match({})).toEqual({});
  });
});
