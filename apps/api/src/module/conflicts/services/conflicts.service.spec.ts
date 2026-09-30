import { BadRequestException, ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { ConflictsService } from "./conflicts.service";
import type { IConflictSourceHandler } from "../types/conflicts.types";

const ADMIN = { _id: new Types.ObjectId(), userName: "alex" };

const query = (value: unknown) => ({
  select: () => query(value),
  limit: () => query(value),
  sort: () => query(value),
  lean: () => Promise.resolve(value),
});

const createEvents = () => ({
  conflictDecided: jest.fn(),
  conflictsApplied: jest.fn(),
});

const createHandler = (
  applied = new Map<string, Types.ObjectId | null>()
): IConflictSourceHandler => ({
  source: "vndb",
  direction: "games",
  linkField: "vndb.vnId",
  describe: jest.fn().mockResolvedValue(null),
  apply: jest.fn().mockResolvedValue(applied),
});

const createService = ({
  conflictsModel = {},
  gamesModel = {},
  events = createEvents(),
  handler = createHandler(),
}: {
  conflictsModel?: object;
  gamesModel?: object;
  events?: ReturnType<typeof createEvents>;
  handler?: ReturnType<typeof createHandler>;
}) => {
  const service = new ConflictsService(
    conflictsModel as never,
    gamesModel as never,
    events as never
  );

  service.register(handler);

  return service;
};

const idleModel = {
  countDocuments: jest.fn().mockResolvedValue(0),
  findOne: () => query(null),
  find: () => query([]),
  aggregate: jest.fn().mockResolvedValue([]),
  distinct: jest.fn().mockResolvedValue([]),
};

describe("ConflictsService", () => {
  it("records a decision only on an undecided conflict among its candidates", async () => {
    const gameId = String(new Types.ObjectId());
    const findOneAndUpdate = jest.fn(() =>
      query({ status: "pending", decision: "match" })
    );
    const events = createEvents();
    const service = createService({
      events,
      conflictsModel: { ...idleModel, findOneAndUpdate },
    });

    await service.decide("vndb", "v1", { gameId }, ADMIN);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        source: "vndb",
        externalId: "v1",
        status: "pending",
        decision: null,
        "candidates.gameId": new Types.ObjectId(gameId),
      },
      expect.anything(),
      { new: true }
    );
    expect(events.conflictDecided).toHaveBeenCalledWith({
      source: "vndb",
      externalId: "v1",
      state: "queued-match",
      decidedBy: "alex",
    });
  });

  it("refuses a decision another admin has already made", async () => {
    const events = createEvents();
    const service = createService({
      events,
      conflictsModel: {
        findOneAndUpdate: () => query(null),
        findOne: () =>
          query({
            status: "pending",
            decision: "skip",
            decidedBy: { userName: "maria" },
          }),
      },
    });

    const decision = service.decide("vndb", "v1", { gameId: null }, ADMIN);

    await expect(decision).rejects.toBeInstanceOf(ConflictException);
    await expect(decision).rejects.toThrow("maria has already decided v1");
    expect(events.conflictDecided).not.toHaveBeenCalled();
  });

  it("rejects a match with a game that is not a candidate", async () => {
    const service = createService({
      conflictsModel: {
        findOneAndUpdate: () => query(null),
        findOne: () => query({ status: "pending", decision: null }),
      },
    });

    await expect(
      service.decide(
        "vndb",
        "v1",
        { gameId: String(new Types.ObjectId()) },
        ADMIN
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("rejects a source without a registered handler", async () => {
    const service = createService({});

    await expect(service.decide("igdb", "1", {}, ADMIN)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("returns a decision the source could not apply to review", async () => {
    const bulkWrite = jest.fn();
    const events = createEvents();
    const handler = createHandler();
    const service = createService({
      events,
      handler,
      conflictsModel: { bulkWrite },
    });
    const _id = new Types.ObjectId();

    await service["applyBatch"](handler, [
      {
        _id,
        source: "vndb",
        externalId: "v1",
        externalName: "Visual novel",
        decision: "match",
        winner: new Types.ObjectId(),
      } as never,
    ]);

    expect(bulkWrite.mock.calls[0][0][0].updateOne).toEqual({
      filter: { _id, status: "pending", decision: "match" },
      update: {
        $set: {
          decision: null,
          winner: null,
          winnerEntryId: null,
          decidedBy: null,
        },
      },
    });
    expect(events.conflictsApplied).toHaveBeenCalledWith({
      source: "vndb",
      externalIds: ["v1"],
    });
  });

  it("resolves an applied match to the game the source returned", async () => {
    const bulkWrite = jest.fn();
    const gameId = new Types.ObjectId();
    const handler = createHandler(new Map([["v1", gameId]]));
    const service = createService({ handler, conflictsModel: { bulkWrite } });
    const _id = new Types.ObjectId();

    await service["applyBatch"](handler, [
      {
        _id,
        externalId: "v1",
        externalName: "Visual novel",
        decision: "match",
        winner: gameId,
      } as never,
    ]);

    expect(bulkWrite.mock.calls[0][0][0].updateOne.update).toEqual({
      $set: { status: "resolved", winner: gameId, decision: null },
    });
  });

  it("marks a skip the source applied without a game as done, not as returned", async () => {
    const bulkWrite = jest.fn();
    const handler = {
      ...createHandler(new Map([["42", null]])),
      direction: "entries" as const,
    };
    const service = createService({ handler, conflictsModel: { bulkWrite } });

    await service["applyBatch"](handler, [
      {
        _id: new Types.ObjectId(),
        externalId: "42",
        externalName: "A game",
        decision: "skip",
        winner: null,
      } as never,
    ]);

    expect(bulkWrite.mock.calls[0][0][0].updateOne.update).toEqual({
      $set: { status: "absent", winner: null, decision: null },
    });
  });
});
