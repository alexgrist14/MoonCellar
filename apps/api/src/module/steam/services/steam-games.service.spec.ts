import mongoose from "mongoose";
import { getSteamUid, isAutoLinkable } from "./steam-games.service";

const pc = new mongoose.Types.ObjectId();
const console = new mongoose.Types.ObjectId();
const pcIds = new Set([String(pc)]);

describe("isAutoLinkable", () => {
  it("links a single PC game that has no Steam page yet", () => {
    expect(
      isAutoLinkable([{ platformIds: [pc], externalPages: [] }], pcIds)
    ).toBe(true);
  });

  it("sends a game without PC among its platforms to review", () => {
    expect(
      isAutoLinkable([{ platformIds: [console], externalPages: [] }], pcIds)
    ).toBe(false);
  });

  it("sends a game that already has another Steam app to review", () => {
    expect(
      isAutoLinkable(
        [
          {
            platformIds: [pc],
            externalPages: [{ name: "Steam", uid: "620", url: "" }],
          },
        ],
        pcIds
      )
    ).toBe(false);
  });

  it("sends several candidates to review", () => {
    expect(
      isAutoLinkable(
        [
          { platformIds: [pc], externalPages: [] },
          { platformIds: [pc], externalPages: [] },
        ],
        pcIds
      )
    ).toBe(false);
  });
});

describe("getSteamUid", () => {
  it("reads the numeric Steam app id", () => {
    expect(
      getSteamUid({ externalPages: [{ name: "Steam", uid: "400", url: "" }] })
    ).toBe("400");
  });
});
