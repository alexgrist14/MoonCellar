import type { ILogChanges } from "@mooncellar/schemas";
import { isEmptyLog, mergeLogChanges } from "./user-logs.utils";

const playing = { category: "playing", isMastered: false, platform: "PC" } as const;
const completed = { ...playing, category: "completed", time: 40 } as const;
const mastered = { ...completed, isMastered: true } as const;

const fold = (...changes: ILogChanges[]) =>
  changes.reduce((log, change) => mergeLogChanges(log, change), {});

describe("mergeLogChanges", () => {
  it("keeps the changed playthrough when a repeated save changes nothing", () => {
    const log = fold(
      { playthrough: { action: "updated", before: playing, after: mastered } },
      { rating: { value: 9, previous: null } },
      { playthrough: { action: "updated", before: mastered, after: mastered } }
    );

    expect(log).toEqual({
      playthrough: { action: "updated", before: playing, after: mastered },
      rating: { value: 9, previous: null },
    });
  });

  it("drops an update that changes nothing", () => {
    expect(
      isEmptyLog(
        fold({ playthrough: { action: "updated", before: playing, after: playing } })
      )
    ).toBe(true);
  });

  it("stays an addition when the added playthrough is edited", () => {
    expect(
      fold(
        { playthrough: { action: "added", after: playing } },
        { playthrough: { action: "updated", before: playing, after: completed } }
      )
    ).toEqual({ playthrough: { action: "added", after: completed } });
  });

  it("cancels a playthrough added and removed in one log", () => {
    expect(
      isEmptyLog(
        fold(
          { playthrough: { action: "added", after: playing } },
          { playthrough: { action: "removed", before: playing } }
        )
      )
    ).toBe(true);
  });

  it("drops an update reverted within the log", () => {
    expect(
      isEmptyLog(
        fold(
          { playthrough: { action: "updated", before: playing, after: completed } },
          { playthrough: { action: "updated", before: completed, after: playing } }
        )
      )
    ).toBe(true);
  });

  it("keeps the removed state of a removal", () => {
    expect(
      fold(
        { playthrough: { action: "updated", before: playing, after: completed } },
        { playthrough: { action: "removed", before: completed } }
      )
    ).toEqual({ playthrough: { action: "removed", before: completed } });
  });

  it("cancels a rating set and removed in one log", () => {
    expect(
      isEmptyLog(
        fold(
          { rating: { value: 8, previous: null } },
          { rating: { value: 7, previous: 8 } },
          { rating: { value: null, previous: 7 } }
        )
      )
    ).toBe(true);
  });

  it("keeps the first previous rating across changes", () => {
    expect(
      fold({ rating: { value: 8, previous: 6 } }, { rating: { value: 9, previous: 8 } })
    ).toEqual({ rating: { value: 9, previous: 6 } });
  });

  it("cancels a favourite added and removed in one log", () => {
    expect(isEmptyLog(fold({ favorite: true }, { favorite: false }))).toBe(true);
  });
});
