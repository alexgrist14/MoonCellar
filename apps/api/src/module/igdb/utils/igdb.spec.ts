import {
  buildIgdbQueryParams,
  getMaxUpdatedAt,
  runWithConcurrency,
} from "./igdb";

describe("IGDB parser utilities", () => {
  it("builds an IGDB APICalypse body with incremental sync controls", () => {
    expect(
      buildIgdbQueryParams("name, updated_at", {
        limit: 100,
        offset: 200,
        where: "updated_at > 123",
        sort: "updated_at asc",
      })
    ).toBe(
      "fields name, updated_at; where updated_at > 123; sort updated_at asc; limit 100; offset 200;"
    );
  });

  it("keeps the previous checkpoint when items do not include updated_at", () => {
    expect(getMaxUpdatedAt([{}, {}], 123)).toBe(123);
  });

  it("returns the largest updated_at value from a page", () => {
    expect(
      getMaxUpdatedAt(
        [
          { id: 1, updated_at: 100 },
          { id: 2, updated_at: 250 },
          { id: 3, updated_at: 200 },
        ],
        50
      )
    ).toBe(250);
  });

  it("runs async work without exceeding the concurrency limit", async () => {
    let active = 0;
    let maxActive = 0;

    const results = await runWithConcurrency([1, 2, 3, 4], 2, async (item) => {
      active += 1;
      maxActive = Math.max(maxActive, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return item * 2;
    });

    expect(results).toEqual([2, 4, 6, 8]);
    expect(maxActive).toBeLessThanOrEqual(2);
  });
});
