import { BadRequestException, NotFoundException } from "@nestjs/common";
import mongoose from "mongoose";
import { HltbService } from "./services/hltb.service";

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

  const service = new HltbService(gamesModel, platformsModel, logger, metrics);

  const getById = jest.fn().mockResolvedValue(byId);

  (service as unknown as { hltbClient: unknown }).hltbClient = {
    search: jest.fn().mockResolvedValue({
      success: true,
      data: searchResults,
    }),
    getById,
  };

  return { service, findOne, updateOne, getById };
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
    const { service, updateOne, getById } = buildService(buildGame(), [], {
      success: true,
      data: buildEntry({ id: 4242, name: "Akumajou Dracula" }),
    });

    const result = await service.syncGame({ gameId: GAME_ID, hltbId: "4242" });

    expect(getById).toHaveBeenCalledWith(4242);
    expect(result.status).toBe("updated");
    expect(result.hltb?.hltbId).toBe("4242");
    expect(result.hltb?.sourceName).toBe("Akumajou Dracula");

    const [, update] = updateOne.mock.calls[0];
    expect(update.$set.hltb.hltbId).toBe("4242");
    expect(update.$unset).toEqual({ hltbNotFoundAt: "" });
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
