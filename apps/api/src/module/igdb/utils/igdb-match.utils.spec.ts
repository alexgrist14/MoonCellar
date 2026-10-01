import { Types } from "mongoose";
import type { IMatchResult } from "../../games/matching/game-matcher.types";
import {
  isConfirmedIgdbMatch,
  withoutOtherIgdbGames,
} from "./igdb-match.utils";

const base = { _id: new Types.ObjectId() };
const vndbOnly = { _id: new Types.ObjectId() };
const sameIgdb = { _id: new Types.ObjectId() };

const candidate = (
  breakdown: Partial<IMatchResult["candidates"][number]["breakdown"]>,
  dateSignal: IMatchResult["candidates"][number]["dateSignal"] = "confirms"
) =>
  ({
    game: { _id: vndbOnly._id },
    score: 13,
    dateSignal,
    breakdown: {
      title: 4,
      companies: 4,
      date: 3,
      platforms: 1,
      genre: 0,
      type: 1,
      ...breakdown,
    },
  }) as IMatchResult["candidates"][number];

const matched = (candidates: IMatchResult["candidates"]): IMatchResult => ({
  verdict: "matched",
  reason: null,
  winner: candidates[0]?.game ?? null,
  candidates,
});

describe("withoutOtherIgdbGames", () => {
  it("drops catalogue games already linked to another IGDB entry", () => {
    const linked = new Map([
      [String(base._id), 405457],
      [String(sameIgdb._id), 416942],
    ]);

    expect(
      withoutOtherIgdbGames([base, vndbOnly, sameIgdb], linked, 416942)
    ).toEqual([vndbOnly, sameIgdb]);
  });

  it("leaves an edition with no candidates when its base game is linked", () => {
    const linked = new Map([[String(base._id), 405457]]);

    expect(withoutOtherIgdbGames([base], linked, 416942)).toEqual([]);
  });
});

describe("isConfirmedIgdbMatch", () => {
  it("accepts a single candidate confirmed by title, companies and date", () => {
    expect(isConfirmedIgdbMatch(matched([candidate({})]))).toBe(true);
  });

  it("rejects a match without company evidence", () => {
    expect(isConfirmedIgdbMatch(matched([candidate({ companies: 0 })]))).toBe(
      false
    );
  });

  it("rejects a match whose date does not confirm", () => {
    expect(isConfirmedIgdbMatch(matched([candidate({}, "unknown")]))).toBe(
      false
    );
  });

  it("rejects a match with competing candidates", () => {
    expect(
      isConfirmedIgdbMatch(matched([candidate({}), candidate({ title: 1 })]))
    ).toBe(false);
  });

  it("rejects anything that is not a matched verdict", () => {
    expect(
      isConfirmedIgdbMatch({
        ...matched([candidate({})]),
        verdict: "ambiguous",
      })
    ).toBe(false);
  });
});
