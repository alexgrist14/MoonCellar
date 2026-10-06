import {
  buildSteamGamePayload,
  decodeHtml,
  parseSteamDate,
} from "./steam-game-payload.utils";

describe("parseSteamDate", () => {
  it("reads a Steam store date as that calendar day in UTC", () => {
    expect(new Date(parseSteamDate("18 Apr, 2011")! * 1000).toISOString()).toBe(
      "2011-04-18T00:00:00.000Z"
    );
  });

  it("returns null for a date Steam has not announced", () => {
    expect(parseSteamDate("Coming soon")).toBeNull();
    expect(parseSteamDate(undefined)).toBeNull();
  });
});

describe("decodeHtml", () => {
  it("drops tags and decodes entities", () => {
    expect(decodeHtml("The &quot;Initiative&quot; <b>is</b> open")).toBe(
      'The "Initiative" is open'
    );
  });
});

describe("buildSteamGamePayload", () => {
  it("maps the store details onto a catalogue game", () => {
    const payload = buildSteamGamePayload(
      620,
      {
        name: "Portal 2",
        developers: ["Valve"],
        publishers: ["Valve"],
        platforms: { windows: true, mac: false, linux: true },
        genres: [{ description: "Action" }, { description: "Adventure" }],
        categories: [
          { description: "Single-player" },
          { description: "Online Co-op" },
        ],
        release_date: { date: "18 Apr, 2011" },
        screenshots: [{ path_full: "https://cdn/1.jpg" }],
      },
      {
        slug: "portal-2",
        platformIdBySlug: new Map([
          ["win", "win-id"],
          ["linux", "linux-id"],
          ["mac", "mac-id"],
        ]),
        cover: "https://cdn/cover.jpg",
        hero: "https://cdn/hero.jpg",
      }
    );

    expect(payload).toMatchObject({
      name: "Portal 2",
      slug: "portal-2",
      type: "Main Game",
      genres: ["Adventure"],
      modes: ["Single player", "Co-operative"],
      platformIds: ["win-id", "linux-id"],
      companies: [
        {
          name: "Valve",
          developer: true,
          publisher: true,
          porting: false,
          supporting: false,
        },
      ],
      screenshots: ["https://cdn/1.jpg"],
      artworks: ["https://cdn/hero.jpg"],
      backgroundImage: "https://cdn/hero.jpg",
      externalPages: [
        {
          name: "Steam",
          uid: "620",
          url: "https://store.steampowered.com/app/620",
        },
      ],
    });
    expect(payload.steam?.appId).toBe(620);
  });
});
