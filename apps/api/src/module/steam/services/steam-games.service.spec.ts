import mongoose from "mongoose";
import {
  getSteamUid,
  getSteamUids,
  isAutoLinkable,
  pickOwnApp,
  toSteamMatchSubject,
} from "./steam-games.service";

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

describe("getSteamUids", () => {
  it("reads every Steam page of a game", () => {
    expect(
      getSteamUids({
        externalPages: [
          { name: "Steam", uid: "8640" },
          { name: "GiantBomb", uid: "28044" },
          { name: "Steam", uid: "8780" },
        ],
      })
    ).toEqual(["8640", "8780"]);
  });
});

describe("pickOwnApp", () => {
  const appById = new Map([
    ["8640", { appid: 8640, name: "RACE On - Expansion" }],
    ["8780", { appid: 8780, name: "RACE On" }],
  ]);

  it("prefers the Steam app named like the game", () => {
    expect(
      pickOwnApp(
        {
          name: "Race On",
          externalPages: [
            { name: "Steam", uid: "8640" },
            { name: "Steam", uid: "8780" },
          ],
        },
        appById
      )?.appid
    ).toBe(8780);
  });

  it("falls back to the first Steam app still on Steam", () => {
    expect(
      pickOwnApp(
        {
          name: "Something else",
          externalPages: [
            { name: "Steam", uid: "1" },
            { name: "Steam", uid: "8640" },
          ],
        },
        appById
      )?.appid
    ).toBe(8640);
  });
});

describe("toSteamMatchSubject", () => {
  it("builds a matcher subject from the store page", () => {
    expect(
      toSteamMatchSubject(
        { appid: 8780, name: "RACE On" },
        {
          name: "RACE On",
          developers: ["SimBin"],
          publishers: ["SimBin"],
          platforms: { windows: true, mac: false, linux: false },
          release_date: { date: "16 Oct, 2009" },
          short_description: "WTCC &amp; more",
        }
      )
    ).toEqual({
      id: "8780",
      name: "RACE On",
      originalName: "RACE On",
      alternativeNames: [],
      type: "Main Game",
      releaseDates: ["2009-10-16"],
      developers: ["SimBin"],
      publishers: ["SimBin"],
      platformSlugs: ["win"],
      description: "WTCC & more",
    });
  });
});
