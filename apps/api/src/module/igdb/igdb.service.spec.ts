import {
  IGDB_GAMES_SYNC_CRON,
  IGDB_GAMES_SYNC_CRON_OPTIONS,
  IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY,
  IGDB_GAMES_SYNC_UPDATED_DELAY_MS,
  IGDB_GAMES_SYNC_UPDATED_LIMIT,
} from "./constants/sync";

describe("IGDBService cron configuration", () => {
  it("uses a daily low-load schedule for incremental game sync", () => {
    expect(IGDB_GAMES_SYNC_CRON).toBe("0 4 * * *");
    expect(IGDB_GAMES_SYNC_CRON_OPTIONS).toEqual({
      name: "igdb-games-sync-updated",
      timeZone: "Europe/Moscow",
    });
    expect(IGDB_GAMES_SYNC_UPDATED_LIMIT).toBe(50);
    expect(IGDB_GAMES_SYNC_UPDATED_DELAY_MS).toBe(2000);
    expect(IGDB_GAMES_SYNC_TO_GAMES_CONCURRENCY).toBe(2);
  });
});

import { Types } from "mongoose";
import { IGDBService } from "./igdb.service";

const found = (value: unknown[]) =>
  Object.assign(Promise.resolve(value), {
    lean: () => Promise.resolve(value),
  });

const createService = ({
  candidates = [] as unknown[],
  current = null as unknown,
  linked = [] as unknown[],
} = {}) => {
  const updateOne = jest.fn().mockResolvedValue({});
  const games = {
    updateOne,
    find: jest.fn(() => ({ select: () => found(linked) })),
    findOne: jest.fn(),
    findById: jest.fn(() => ({ lean: () => Promise.resolve(current) })),
    exists: jest.fn().mockResolvedValue(null),
  };
  const platforms = {
    find: jest.fn().mockReturnValue({ select: jest.fn(() => found([])) }),
  };
  const conflicts = { record: jest.fn(), register: jest.fn() };
  const gameMatcher = {
    getPlatformSlugById: jest.fn().mockResolvedValue(new Map()),
    findCandidates: jest.fn().mockResolvedValue({
      candidatesBySubject: new Map([["1234", candidates]]),
      sharedTitles: new Set(),
    }),
  };
  const service = new IGDBService(
    {} as never,
    games as never,
    platforms as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    conflicts as never,
    gameMatcher as never
  );
  return { service, updateOne, platforms, conflicts };
};

const igdbGame = { id: 1234, slug: "doom", name: "Doom" } as never;

describe("IGDBService isStopParsing guard", () => {
  it("skips a game flagged with isStopParsing and writes nothing", async () => {
    const { service, updateOne, platforms } = createService();

    const result = await service["upsertGameFromIgdb"](igdbGame, {
      slug: "doom",
      isStopParsing: true,
    } as never);

    expect(result).toBe("doom skipped");
    expect(updateOne).not.toHaveBeenCalled();
    expect(platforms.find).not.toHaveBeenCalled();
  });

  it("skips the single-field image path too", async () => {
    const { service, updateOne } = createService();

    const result = await service["upsertGameFromIgdb"](
      igdbGame,
      { slug: "doom", isStopParsing: true } as never,
      { field: "cover" }
    );

    expect(result).toBe("doom skipped");
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("writes normally when the flag is absent", async () => {
    const { service, updateOne } = createService();

    await service["upsertGameFromIgdb"](igdbGame, {
      slug: "doom",
      isStopParsing: false,
    } as never);

    expect(updateOne).toHaveBeenCalledTimes(1);
  });
});

const DOOM_RELEASE = Date.UTC(1993, 11, 10) / 1000;

const syncedDoom = {
  id: 1234,
  slug: "doom",
  name: "Doom Eternal Legacy",
  first_release_date: DOOM_RELEASE,
  summary: "Rip and tear",
} as never;

const handMadeDoom = {
  _id: new Types.ObjectId(),
  slug: "doom-eternal-legacy",
  name: "Doom Eternal Legacy",
  nameNormalized: "doom eternal legacy",
  type: null,
  genres: [],
  first_release: Date.UTC(1993, 11, 1) / 1000,
  release_dates: [],
  alternative_names: [],
  companies: [],
  platformIds: [],
  summary: "",
  isCustom: true,
};

describe("IGDBService conflicts for new games", () => {
  afterEach(() => {
    delete process.env.IGDB_AUTO_LINK;
  });

  it("sends a new IGDB game that matches a hand-made game by title and year to conflicts instead of inserting it", async () => {
    const { service, updateOne, conflicts } = createService({
      candidates: [handMadeDoom],
    });

    const result = await service["upsertGameFromIgdb"](syncedDoom, undefined, {
      matchNew: true,
    });

    expect(result).toBe("doom conflict");
    expect(updateOne).not.toHaveBeenCalled();
    expect(conflicts.record).toHaveBeenCalledWith("igdb", [
      expect.objectContaining({
        externalId: "1234",
        reason: expect.any(String),
      }),
    ]);
    expect(conflicts.record.mock.calls[0][1][0].candidates[0].dateSignal).toBe(
      "confirms"
    );
  });

  it("never auto-links a hand-made game, even with auto-link on", async () => {
    process.env.IGDB_AUTO_LINK = "true";
    const { service, updateOne, conflicts } = createService({
      candidates: [handMadeDoom],
    });

    await service["upsertGameFromIgdb"](syncedDoom, undefined, {
      matchNew: true,
    });

    expect(updateOne).not.toHaveBeenCalled();
    expect(conflicts.record).toHaveBeenCalled();
  });

  it("ignores a candidate already linked to another IGDB game and inserts a new one", async () => {
    const { service, updateOne, conflicts } = createService({
      candidates: [handMadeDoom],
      linked: [{ _id: handMadeDoom._id, igdb: { gameId: 999 } }],
    });

    await service["upsertGameFromIgdb"](syncedDoom, undefined, {
      matchNew: true,
    });

    expect(conflicts.record).not.toHaveBeenCalled();
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  it("inserts a new IGDB game when nothing in the catalogue matches", async () => {
    const { service, updateOne, conflicts } = createService();

    await service["upsertGameFromIgdb"](syncedDoom, undefined, {
      matchNew: true,
    });

    expect(conflicts.record).not.toHaveBeenCalled();
    expect(updateOne).toHaveBeenCalledTimes(1);
  });

  it("only fills empty fields of a hand-made game linked to IGDB", async () => {
    const { service, updateOne } = createService({
      current: { name: "My Doom", summary: "Written by hand", genres: [] },
    });

    await service["upsertGameFromIgdb"](
      {
        ...(syncedDoom as object),
        genres: [{ id: 1, name: "Shooter" }],
      } as never,
      { _id: new Types.ObjectId(), slug: "my-doom", isCustom: true } as never
    );

    const [, { $set }] = updateOne.mock.calls[0];

    expect($set).not.toHaveProperty("name");
    expect($set).not.toHaveProperty("summary");
    expect($set).not.toHaveProperty("slug");
    expect($set.genres).toEqual(["Shooter"]);
    expect($set.igdb.gameId).toBe(1234);
  });
});
