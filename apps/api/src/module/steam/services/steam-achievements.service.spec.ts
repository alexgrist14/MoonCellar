import {
  countSchemaAchievements,
  getSteamAppId,
  SteamAchievementsFailedError,
  SteamAchievementsService,
} from "./steam-achievements.service";

describe("countSchemaAchievements", () => {
  it("counts the achievements of a game that has them", () => {
    expect(
      countSchemaAchievements({
        game: { availableGameStats: { achievements: [{}, {}, {}] } },
      })
    ).toBe(3);
  });

  it("reads a game without stats as zero", () => {
    expect(countSchemaAchievements({ game: {} })).toBe(0);
    expect(countSchemaAchievements({})).toBe(0);
  });
});

describe("getSteamAppId", () => {
  it("takes the numeric uid of the Steam page", () => {
    expect(
      getSteamAppId({
        externalPages: [
          { name: "GOG", uid: "abc" },
          { name: "Steam", uid: "620" },
        ],
      })
    ).toBe(620);
  });

  it("ignores a Steam page without a numeric id", () => {
    expect(
      getSteamAppId({ externalPages: [{ name: "Steam", uid: "portal-2" }] })
    ).toBeNull();
  });
});

describe("SteamAchievementsService.fetchTotal", () => {
  process.env.STEAM_API_KEY = "test";
  const service = new SteamAchievementsService(
    {} as never,
    { setContext: jest.fn() } as never,
    {} as never
  );
  const answer = (status: number, body: string) =>
    jest
      .spyOn(global, "fetch")
      .mockResolvedValue(new Response(body, { status }));

  afterEach(() => jest.restoreAllMocks());

  it("reads a 403 with an empty schema as no achievements", async () => {
    answer(403, '{"game":{}}');
    await expect(service.fetchTotal(1036080)).resolves.toBe(0);
  });

  it("fails on a 403 that rejects the key", async () => {
    answer(403, "<html><h1>Forbidden</h1></html>");
    await expect(service.fetchTotal(440)).rejects.toThrow(
      SteamAchievementsFailedError
    );
  });
});
