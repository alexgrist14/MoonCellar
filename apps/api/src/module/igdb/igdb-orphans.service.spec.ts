import { Logger } from "@nestjs/common";
import { Types } from "mongoose";
import type { IIgdbOrphansRun } from "@mooncellar/schemas";
import { igdbAgent, igdbAuth } from "./utils/igdb";
import { IgdbOrphansService } from "./igdb-orphans.service";

jest.mock("../games/services/games.service", () => ({
  GamesService: class {},
}));

jest.mock("./utils/igdb", () => ({
  ...jest.requireActual("./utils/igdb"),
  igdbAuth: jest.fn(),
  igdbAgent: jest.fn(),
  wait: jest.fn().mockResolvedValue(undefined),
}));

const mockedAgent = igdbAgent as jest.Mock;
const mockedAuth = igdbAuth as jest.Mock;

type TGame = {
  _id: Types.ObjectId;
  name: string;
  slug: string;
  igdb: { gameId: number };
  vndb?: { vnId?: string };
  isCustom?: boolean;
};

const makeGames = (count: number): TGame[] =>
  Array.from({ length: count }, (_, i) => ({
    _id: new Types.ObjectId(),
    name: `Game ${i + 1}`,
    slug: `game-${i + 1}`,
    igdb: { gameId: i + 1 },
  }));

const answerExcept = (missing: number[]) =>
  mockedAgent.mockImplementation(async (_url, _token, query: string) => {
    const ids = query
      .match(/id = \(([^)]*)\)/)![1]
      .split(",")
      .map(Number);
    return {
      status: 200,
      data: ids.filter((id) => !missing.includes(id)).map((id) => ({ id })),
    };
  });

const createService = ({
  games = makeGames(100),
  userData = {} as Record<string, Types.ObjectId[]>,
  lockTaken = false,
} = {}) => {
  const pages = [games];
  const find = jest.fn(() => {
    const chain = {
      sort: () => chain,
      limit: () => chain,
      select: () => chain,
      lean: () => Promise.resolve(pages.shift() ?? []),
    };
    return chain;
  });
  const updateOne = jest.fn().mockResolvedValue({});
  const deleteGame = jest.fn().mockResolvedValue({});
  const locks = {
    updateOne: lockTaken
      ? jest.fn().mockRejectedValue({ code: 11000 })
      : jest.fn().mockResolvedValue({}),
    deleteOne: jest.fn().mockResolvedValue({}),
  };
  const connection = {
    collection: (name: string) =>
      name === "locks"
        ? locks
        : { distinct: jest.fn(async () => userData[name] ?? []) },
  };
  const service = new IgdbOrphansService(
    { find, updateOne } as never,
    connection as never,
    { deleteGame } as never,
    { logger: { child: () => ({}) } } as never,
    { trackSync: (_job: string, fn: () => unknown) => fn() } as never
  );

  return { service, find, updateOne, deleteGame };
};

const hold = () => {
  let release!: () => void;
  const gate = new Promise<void>((resolve) => (release = resolve));
  mockedAgent.mockImplementationOnce(async () => {
    await gate;
    return { status: 200, data: [] };
  });
  return release;
};

const settle = async (run: IIgdbOrphansRun) => {
  while (run.running) await new Promise((resolve) => setImmediate(resolve));
  return run;
};

describe("IgdbOrphansService", () => {
  let errorSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Logger.prototype, "log").mockImplementation();
    jest.spyOn(Logger.prototype, "warn").mockImplementation();
    jest.spyOn(Logger.prototype, "debug").mockImplementation();
    errorSpy = jest.spyOn(Logger.prototype, "error").mockImplementation();
    mockedAuth.mockResolvedValue({ data: { access_token: "token" } });
    answerExcept([]);
  });

  it("returns before the scan finishes, and a dry run deletes nothing", async () => {
    let release!: () => void;
    const gate = new Promise<void>((resolve) => (release = resolve));
    mockedAgent.mockImplementationOnce(async () => {
      await gate;
      return {
        status: 200,
        data: Array.from({ length: 99 }, (_, i) => ({ id: i + 1 })),
      };
    });
    const { service, updateOne, deleteGame } = createService();

    const run = service.start({});

    expect(run.running).toBe(true);
    expect(run.scanned).toBe(0);

    release();
    await settle(run);

    expect(run).toMatchObject({ apply: false, missing: 1, deleted: 1 });
    expect(run.deletedGames).toEqual([
      expect.objectContaining({ slug: "game-100", igdbId: 100 }),
    ]);
    expect(deleteGame).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("answers 409 while a run is in progress", async () => {
    const release = hold();
    const { service } = createService();

    const run = service.start({});

    expect(() => service.start({})).toThrow("already running");

    release();
    await settle(run);
  });

  it("unlinks VNDB-owned and hand-made games instead of deleting them", async () => {
    const games = makeGames(100);
    games[0].vndb = { vnId: "v17" };
    games[1].isCustom = true;
    answerExcept([1, 2]);
    const { service, updateOne, deleteGame } = createService({ games });

    const run = await settle(service.start({ apply: true }));

    expect(run).toMatchObject({ unlinked: 2, deleted: 0 });
    expect(run.unlinkedGames.map((game) => game.reason)).toEqual([
      "vndb-owned",
      "custom",
    ]);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: games[0]._id, "igdb.gameId": 1 },
      { $unset: { igdb: "" } }
    );
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("keeps games with user data and deletes only plain orphans", async () => {
    const games = makeGames(100);
    answerExcept([1, 2]);
    const { service, updateOne, deleteGame } = createService({
      games,
      userData: { playthroughs: [games[0]._id] },
    });

    const run = await settle(service.start({ apply: true }));

    expect(run).toMatchObject({ kept: 1, deleted: 1, unlinked: 0 });
    expect(run.keptGames[0]).toMatchObject({
      slug: "game-1",
      reason: "user-data",
    });
    expect(deleteGame).toHaveBeenCalledTimes(1);
    expect(deleteGame).toHaveBeenCalledWith(games[1]._id);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuses to write when an IGDB batch fails", async () => {
    mockedAgent.mockRejectedValue(new Error("429"));
    const { service, updateOne, deleteGame } = createService();

    const run = await settle(service.start({ apply: true }));

    expect(run.refusedReason).toMatch(/IGDB request failed/);
    expect(mockedAgent).toHaveBeenCalledTimes(3);
    expect(deleteGame).not.toHaveBeenCalled();
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("refuses to write when too many games look missing", async () => {
    answerExcept([1, 2, 3]);
    const { service, deleteGame } = createService();

    const run = await settle(service.start({ apply: true }));

    expect(run.refusedReason).toMatch(/above the 2% limit/);
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("defers plain orphans above the delete limit", async () => {
    answerExcept([1, 2]);
    const { service, deleteGame } = createService();

    const run = await settle(service.start({ apply: true, limit: 1 }));

    expect(run).toMatchObject({ deleted: 1, deferred: 1 });
    expect(deleteGame).toHaveBeenCalledTimes(1);
  });

  it("logs a failed background run instead of rejecting", async () => {
    mockedAuth.mockRejectedValue(new Error("twitch down"));
    const { service } = createService();

    const run = await settle(service.start({}));

    expect(run.error).toBe("twitch down");
    expect(errorSpy).toHaveBeenCalledWith(
      expect.any(Error),
      "IGDB orphans run failed"
    );
  });

  it("runs the cron in apply mode", async () => {
    answerExcept([100]);
    const { service, deleteGame } = createService();

    const run = await service.cron();

    expect(run).toMatchObject({ trigger: "cron", apply: true, deleted: 1 });
    expect(deleteGame).toHaveBeenCalledTimes(1);
  });

  it("skips the cron while a manual run is in progress", async () => {
    const release = hold();
    const { service } = createService();

    const manual = service.start({});

    await expect(service.runCron()).resolves.toBeUndefined();
    expect(service.getState()).toBe(manual);

    release();
    await settle(manual);
  });

  it("skips the cron while another process holds the lock", async () => {
    const { service, find } = createService({ lockTaken: true });

    const run = await service.runCron();

    expect(run?.error).toMatch(/another process/);
    expect(find).not.toHaveBeenCalled();
  });
});
