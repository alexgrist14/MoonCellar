import { pickSteamCandidate } from "./steam-match.utils";

const base = { id: "base", name: "Hell is Us", type: "Main Game" };
const deluxe = {
  id: "deluxe",
  name: "Hell is Us: Deluxe Edition",
  versionTitle: "Deluxe Edition",
  type: "Main Game",
};

describe("pickSteamCandidate", () => {
  it("prefers the game named as on Steam over an edition listed first", () => {
    expect(pickSteamCandidate([deluxe, base], "Hell is Us")).toBe("base");
  });

  it("picks the edition when the Steam name is the edition", () => {
    expect(
      pickSteamCandidate([base, deluxe], "Hell is Us - Deluxe Edition")
    ).toBe("deluxe");
  });

  it("prefers a non-edition main game when no name matches", () => {
    expect(
      pickSteamCandidate(
        [
          deluxe,
          { id: "bundle", name: "Hell is Us Bundle", type: "Bundle" },
          base,
        ],
        "HELL IS US™ Standard"
      )
    ).toBe("base");
  });

  it("returns null without candidates", () => {
    expect(pickSteamCandidate([], "Anything")).toBeNull();
  });
});
