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

import { IGDBService } from "./igdb.service";

const createService = () => {
  const updateOne = jest.fn().mockResolvedValue({});
  const games = { updateOne, find: jest.fn(), findOne: jest.fn() };
  const platforms = { find: jest.fn().mockReturnValue({ select: jest.fn().mockResolvedValue([]) }) };
  const service = new IGDBService(
    {} as never,
    games as never,
    platforms as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never
  );
  return { service, updateOne, platforms };
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
