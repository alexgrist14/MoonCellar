import { BadRequestException, NotFoundException } from "@nestjs/common";
import mongoose from "mongoose";
import { HltbService } from "./services/hltb.service";
import { mapHltbEntryToField, mapRawHltbEntry } from "./utils/hltb.utils";

jest.mock("../../shared/utils", () => ({
  ...jest.requireActual("../../shared/utils"),
  sleep: jest.fn().mockResolvedValue(undefined),
}));

const GAME_ID = "507f1f77bcf86cd799439011";
const PLATFORM_ID = new mongoose.Types.ObjectId();

const buildGame = (overrides: Record<string, unknown> = {}) => ({
  _id: new mongoose.Types.ObjectId(GAME_ID),
  slug: "super-castlevania-iv",
  name: "Super Castlevania IV",
  platformIds: [PLATFORM_ID],
  release_dates: [{ year: 1991 }],
  first_release: null,
  ...overrides,
});

const buildEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 6910,
  name: "Super Castlevania IV",
  type: "game",
  mainTime: 4 * 3600,
  mainExtraTime: 5 * 3600,
  completionistTime: 7 * 3600,
  platforms: ["Super Nintendo"],
  releaseYear: 1991,
  ...overrides,
});

const buildService = (
  game: unknown,
  searchResults: unknown[],
  byId: unknown = { success: false, data: null }
) => {
  const updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  const findOne = jest.fn().mockReturnValue({
    select: () => ({ lean: () => Promise.resolve(game) }),
  });
  const gamesModel = { findOne, updateOne } as never;
  const platformsModel = {
    find: () => ({
      select: () => ({
        lean: () =>
          Promise.resolve([{ _id: PLATFORM_ID, name: "Super Nintendo" }]),
      }),
    }),
  } as never;
  const logger = {
    setContext: jest.fn(),
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  } as never;
  const metrics = { recordGames: jest.fn() } as never;

  const conflicts = {
    refresh: jest.fn(),
    register: jest.fn(),
    removeForGame: jest.fn().mockResolvedValue(0),
  };
  const service = new HltbService(
    gamesModel,
    platformsModel,
    logger,
    metrics,
    conflicts as never
  );

  const getById = jest.fn().mockResolvedValue(byId);
  const search = jest.fn().mockResolvedValue({
    success: true,
    data: searchResults,
  });

  (service as unknown as { hltbClient: unknown }).hltbClient = {
    search,
    getById,
  };

  return { service, findOne, updateOne, getById, search, conflicts };
};

describe("HltbService.syncGame", () => {
  it("stores the matched times and clears the not-found marker", async () => {
    const { service, findOne, updateOne } = buildService(buildGame(), [
      buildEntry(),
    ]);

    const result = await service.syncGame({ gameId: GAME_ID });

    expect(findOne).toHaveBeenCalledWith({
      _id: new mongoose.Types.ObjectId(GAME_ID),
    });
    expect(result.status).toBe("updated");
    expect(result.slug).toBe("super-castlevania-iv");
    expect(result.hltb?.hltbId).toBe("6910");
    expect(result.hltb?.mainStory).toBe(4);

    const [filter, update] = updateOne.mock.calls[0];
    expect(filter).toEqual({ _id: new mongoose.Types.ObjectId(GAME_ID) });
    expect(update.$set.hltb.hltbId).toBe("6910");
    expect(update.$unset).toEqual({ hltbNotFoundAt: "" });
  });

  it("looks the game up by slug when no id is given", async () => {
    const { service, findOne } = buildService(buildGame(), [buildEntry()]);

    await service.syncGame({ slug: "super-castlevania-iv" });

    expect(findOne).toHaveBeenCalledWith({ slug: "super-castlevania-iv" });
  });

  it("drops stale times when no verified match is found", async () => {
    const { service, updateOne } = buildService(
      buildGame({ hltb: { hltbId: "1", updatedAt: "2020-01-01" } }),
      [buildEntry({ name: "A Completely Different Game", releaseYear: 2015 })]
    );

    const result = await service.syncGame({ gameId: GAME_ID });

    expect(result.status).toBe("not_found");
    expect(result.hltb).toBeNull();

    const [, update] = updateOne.mock.calls[0];
    expect(update.$set.hltbNotFoundAt).toEqual(expect.any(String));
    expect(update.$unset).toEqual({ hltb: "" });
  });

  it("stores co-op and versus times for a game HLTB lists without a single-player block", async () => {
    const { service, updateOne } = buildService(
      buildGame({ name: "It Takes Two", release_dates: [{ year: 2021 }] }),
      [
        buildEntry({
          id: 80199,
          name: "It Takes Two",
          mainTime: undefined,
          mainExtraTime: undefined,
          completionistTime: undefined,
          coopTime: 51101,
          multiplayerTime: 8273,
          releaseYear: 2021,
        }),
      ]
    );

    const result = await service.syncGame({ gameId: GAME_ID });

    expect(result.status).toBe("updated");
    expect(result.hltb?.coop).toBe(14.2);
    expect(result.hltb?.multiplayer).toBe(2.3);
    expect(updateOne.mock.calls[0][1].$unset).toEqual({ hltbNotFoundAt: "" });
  });

  it("sends a match without times to review with the entries that have them", async () => {
    const { service, conflicts } = buildService(
      buildGame({ name: "Titan Quest: Gold Edition", release_dates: [] }),
      [
        buildEntry({
          id: 188894,
          name: "Titan Quest: Gold Edition",
          mainTime: undefined,
          mainExtraTime: undefined,
          completionistTime: undefined,
          platforms: ["PC"],
          releaseYear: 2007,
        }),
        buildEntry({
          id: 10379,
          name: "Titan Quest",
          imageUrl: "https://howlongtobeat.com/games/10379_Titan_Quest.jpg",
          platforms: ["PC"],
          releaseYear: 2006,
        }),
      ]
    );

    const result = await service.syncGame({ gameId: GAME_ID });

    expect(result.status).toBe("not_found");
    const [[source, [record]]] = conflicts.refresh.mock.calls;
    expect(source).toBe("hltb");
    expect(record.entries.map(({ id }: { id: string }) => id)).toEqual([
      "10379",
    ]);
    expect(record.entries[0].cover).toBe(
      "https://howlongtobeat.com/games/10379_Titan_Quest.jpg"
    );
  });

  it("rejects a malformed game id", async () => {
    const { service } = buildService(buildGame(), [buildEntry()]);

    await expect(service.syncGame({ gameId: "not-an-id" })).rejects.toThrow(
      BadRequestException
    );
  });

  it("rejects a request without a target", async () => {
    const { service } = buildService(buildGame(), [buildEntry()]);

    await expect(service.syncGame({})).rejects.toThrow(BadRequestException);
  });

  it("reports a missing game", async () => {
    const { service } = buildService(null, [buildEntry()]);

    await expect(service.syncGame({ gameId: GAME_ID })).rejects.toThrow(
      NotFoundException
    );
  });
});

describe("HltbService.syncGame with an explicit HLTB id", () => {
  it("stores the requested entry without running the matcher", async () => {
    const { service, updateOne, getById, conflicts } = buildService(
      buildGame(),
      [],
      {
        success: true,
        data: buildEntry({ id: 4242, name: "Akumajou Dracula" }),
      }
    );

    const result = await service.syncGame({ gameId: GAME_ID, hltbId: "4242" });

    expect(getById).toHaveBeenCalledWith(4242);
    expect(result.status).toBe("updated");
    expect(result.hltb?.hltbId).toBe("4242");
    expect(result.hltb?.sourceName).toBe("Akumajou Dracula");

    const [, update] = updateOne.mock.calls[0];
    expect(update.$set.hltb.hltbId).toBe("4242");
    expect(update.$unset).toEqual({ hltbNotFoundAt: "" });
    expect(conflicts.removeForGame).toHaveBeenCalledWith(
      "hltb",
      new mongoose.Types.ObjectId(GAME_ID),
      { externalIds: [GAME_ID] }
    );
  });

  it("leaves the stored times untouched when the id is unknown", async () => {
    const { service, updateOne } = buildService(
      buildGame({ hltb: { hltbId: "1", updatedAt: "2020-01-01" } }),
      [],
      { success: true, data: null }
    );

    await expect(
      service.syncGame({ gameId: GAME_ID, hltbId: "999999" })
    ).rejects.toThrow(NotFoundException);

    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuses an entry without completion times", async () => {
    const { service, updateOne } = buildService(buildGame(), [], {
      success: true,
      data: buildEntry({
        mainTime: undefined,
        mainExtraTime: undefined,
        completionistTime: undefined,
      }),
    });

    await expect(
      service.syncGame({ gameId: GAME_ID, hltbId: "6910" })
    ).rejects.toThrow(BadRequestException);

    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuses a non-numeric HLTB id", async () => {
    const { service, getById } = buildService(buildGame(), []);

    await expect(
      service.syncGame({ gameId: GAME_ID, hltbId: "abc" })
    ).rejects.toThrow(BadRequestException);

    expect(getById).not.toHaveBeenCalled();
  });
});

describe("HltbService.syncAllGames", () => {
  const rawEntry = (overrides: Record<string, unknown> = {}) => ({
    game_id: 6910,
    game_name: "Super Castlevania IV",
    game_alias: "",
    game_type: "game",
    game_image: "",
    comp_lvl_sp: 1,
    comp_lvl_co: 0,
    comp_lvl_mp: 0,
    comp_main: 4 * 3600,
    comp_plus: 0,
    comp_100: 0,
    comp_all: 0,
    comp_main_count: 10,
    comp_plus_count: 0,
    comp_100_count: 0,
    comp_all_count: 0,
    invested_co: 0,
    invested_mp: 0,
    invested_co_count: 0,
    invested_mp_count: 0,
    review_score: 0,
    profile_platform: "Super Nintendo",
    profile_popular: 1,
    release_world: 1991,
    ...overrides,
  });

  const serveCatalogue = (pages: unknown[][] | "failing") =>
    jest.spyOn(global, "fetch").mockImplementation(async (url, init) => {
      if (String(url).includes("/init")) {
        return new Response(
          JSON.stringify({ token: "t", hpKey: "k", hpVal: "v" })
        );
      }

      if (pages === "failing") return new Response("", { status: 500 });

      const { searchPage } = JSON.parse(String(init?.body));

      return new Response(
        JSON.stringify({
          count: pages.flat().length,
          pageTotal: pages.length,
          data: pages[searchPage - 1] ?? [],
        })
      );
    });

  const buildSync = (games: Record<string, unknown>[]) => {
    const bulkWrite = jest.fn().mockResolvedValue({});
    const locks = {
      updateOne: jest.fn().mockResolvedValue({}),
      deleteOne: jest.fn().mockResolvedValue({}),
    };
    const gamesModel = {
      db: { collection: () => locks },
      bulkWrite,
      find: () => ({
        select: () => ({
          lean: () => ({
            cursor: async function* () {
              yield* games;
            },
          }),
        }),
      }),
    } as never;
    const platformsModel = {
      find: () => ({
        select: () => ({
          lean: () =>
            Promise.resolve([{ _id: PLATFORM_ID, name: "Super Nintendo" }]),
        }),
      }),
    } as never;
    const conflicts = {
      register: jest.fn(),
      refresh: jest.fn().mockResolvedValue(undefined),
      dismissUndecided: jest.fn().mockResolvedValue(0),
    };
    const service = new HltbService(
      gamesModel,
      platformsModel,
      {
        setContext: jest.fn(),
        info: jest.fn(),
        warn: jest.fn(),
        error: jest.fn(),
        debug: jest.fn(),
      } as never,
      { recordGames: jest.fn() } as never,
      conflicts as never
    );

    return { service, bulkWrite, conflicts };
  };

  const ops = (bulkWrite: jest.Mock) =>
    bulkWrite.mock.calls.flatMap(([batch]) => batch);

  afterEach(() => jest.restoreAllMocks());

  it("matches every game against the downloaded catalogue", async () => {
    serveCatalogue([
      [rawEntry()],
      [
        rawEntry({
          game_id: 700001,
          game_name: "Mixtape",
          release_world: 2018,
        }),
      ],
    ]);
    const matched = buildGame();
    const unsure = buildGame({
      _id: new mongoose.Types.ObjectId(),
      name: "Mixtape",
      release_dates: [{ year: 2026 }],
    });
    const missing = buildGame({
      _id: new mongoose.Types.ObjectId(),
      name: "Nothing Like It",
    });
    const { service, bulkWrite, conflicts } = buildSync([
      matched,
      unsure,
      missing,
    ]);

    const result = await service.syncAllGames();

    expect(result).toMatchObject({
      status: "finished",
      catalog: 2,
      updated: 1,
      notFound: 2,
    });
    const writes = ops(bulkWrite);
    expect(writes).toHaveLength(3);
    expect(writes[0].updateOne.update.$set.hltb).toMatchObject({
      hltbId: "6910",
      mainStory: 4,
    });
    expect(writes[1].updateOne.update.$set.hltbNotFoundAt).toEqual(
      expect.any(String)
    );
    const [[, [record]]] = conflicts.refresh.mock.calls;
    expect(record.externalId).toBe(String(unsure._id));
    expect(conflicts.dismissUndecided).toHaveBeenCalledWith("hltb", [
      String(matched._id),
      String(missing._id),
    ]);
  });

  it("does not rewrite a game whose times did not change", async () => {
    serveCatalogue([[rawEntry()]]);
    const game = buildGame({
      hltb: {
        ...mapHltbEntryToField(mapRawHltbEntry(rawEntry() as never)),
        updatedAt: "2020-01-01T00:00:00.000Z",
      },
    });
    const { service, bulkWrite } = buildSync([game]);

    const result = await service.syncAllGames();

    expect(result.unchanged).toBe(1);
    expect(ops(bulkWrite)).toHaveLength(0);
  });

  it("writes nothing when the catalogue cannot be downloaded", async () => {
    serveCatalogue("failing");
    const { service, bulkWrite, conflicts } = buildSync([buildGame()]);

    await expect(service.syncAllGames()).rejects.toThrow(
      "HLTB catalogue page 1 failed"
    );
    expect(bulkWrite).not.toHaveBeenCalled();
    expect(conflicts.refresh).not.toHaveBeenCalled();
  });

  it("refreshes a stored link by its id instead of matching it again", async () => {
    serveCatalogue([[rawEntry({ comp_main: 6 * 3600 })]]);
    const linked = buildGame({
      name: "Akumajou Dracula",
      hltb: { hltbId: "6910", mainStory: 4, updatedAt: "2020-01-01" },
    });
    const absent = buildGame({
      _id: new mongoose.Types.ObjectId(),
      hltb: { hltbId: "4242", mainStory: 3, updatedAt: "2020-01-01" },
    });
    const { service, bulkWrite, conflicts } = buildSync([linked, absent]);

    const result = await service.syncAllGames();

    expect(result).toMatchObject({ updated: 1, skipped: 1 });
    const writes = ops(bulkWrite);
    expect(writes).toHaveLength(1);
    expect(writes[0].updateOne.update.$set.hltb).toMatchObject({
      hltbId: "6910",
      mainStory: 6,
    });
    expect(conflicts.dismissUndecided).toHaveBeenCalledWith("hltb", [
      String(linked._id),
    ]);
  });
});
