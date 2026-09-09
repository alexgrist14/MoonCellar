import { pickFollowingsStatus } from "./followings-status.utils";

describe("pickFollowingsStatus", () => {
  it("returns null for empty input", () => {
    expect(pickFollowingsStatus([])).toBeNull();
  });

  it("prefers mastered over completed", () => {
    expect(
      pickFollowingsStatus([
        { category: "completed", isMastered: true },
        { category: "completed", isMastered: false },
        { category: "playing" },
      ])
    ).toEqual({ category: "mastered", count: 1 });
  });

  it("counts multiple playthroughs in the winning category", () => {
    expect(
      pickFollowingsStatus([
        { category: "completed" },
        { category: "completed" },
        { category: "playing" },
      ])
    ).toEqual({ category: "completed", count: 2 });
  });

  it("counts multiple mastered playthroughs", () => {
    expect(
      pickFollowingsStatus([
        { category: "completed", isMastered: true },
        { category: "completed", isMastered: true },
        { category: "completed", isMastered: false },
      ])
    ).toEqual({ category: "mastered", count: 2 });
  });

  it("uses full priority order", () => {
    expect(pickFollowingsStatus([{ category: "dropped" }])).toEqual({
      category: "dropped",
      count: 1,
    });
    expect(
      pickFollowingsStatus([
        { category: "wishlist" },
        { category: "dropped" },
      ])
    ).toEqual({ category: "wishlist", count: 1 });
    expect(
      pickFollowingsStatus([
        { category: "backlog" },
        { category: "wishlist" },
      ])
    ).toEqual({ category: "backlog", count: 1 });
    expect(
      pickFollowingsStatus([
        { category: "played" },
        { category: "backlog" },
      ])
    ).toEqual({ category: "played", count: 1 });
    expect(
      pickFollowingsStatus([
        { category: "playing" },
        { category: "played" },
      ])
    ).toEqual({ category: "playing", count: 1 });
  });
});
