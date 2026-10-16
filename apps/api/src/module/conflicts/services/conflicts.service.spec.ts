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
  bulkWrite: jest.fn(),
};

const CREATED = new Types.ObjectId();

const buildSkipUndo = ({
  externalData,
  usedIds = [] as string[],
}: {
  externalData: Record<string, unknown>;
  usedIds?: string[];
}) => {
  const distinct = jest.fn((_field: string, filter: Record<string, unknown>) =>
    Promise.resolve(
      JSON.stringify(filter).includes(String(CREATED)) ? usedIds : []
    )
  );
  const updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
  const deleteGame = jest.fn().mockResolvedValue(undefined);
  const service = createService({
    conflictsModel: {
      ...idleModel,
      findOne: jest
        .fn()
        .mockReturnValueOnce(
          query({
            _id: "c2",
            externalId: "8937",
            status: "absent",
            externalData,
            winner: CREATED,
          })
        )
        .mockReturnValue(query(null)),
      updateOne,
    },
    gamesModel: {
      findById: () => query({ _id: CREATED, name: "Spider Solitaire" }),
      db: { collection: () => ({ distinct }) },
    },
  });

  service.useDeleteGame(deleteGame);

  return {
    service,
    updateOne,
    deleteGame,
    setExternalData: jest.spyOn(service, "setExternalData"),
  };
};

describe("ConflictsService", () => {
  it("undoes only a matched conflict through its source and requeues it", async () => {
    const gameId = new Types.ObjectId();
    const conflict = {
      _id: "c1",
      externalId: "6910",
      status: "resolved",
      externalData: { applied: [] },
      winners: [gameId],
    };
    const updateOne = jest.fn().mockResolvedValue({ modifiedCount: 1 });
    const undo = jest.fn().mockResolvedValue(undefined);
    const events = createEvents();
    const service = createService({
      events,
      conflictsModel: {
        ...idleModel,
        findOne: jest
          .fn()
          .mockReturnValueOnce(query(conflict))
          .mockReturnValue(query(null)),
        updateOne,
      },
      handler: { ...createHandler(), undo },
    });
    const gamesUpdate = jest.fn();

    service["gamesModel"].updateOne = gamesUpdate;
    await service.undo("vndb", "6910", ADMIN);

    expect(gamesUpdate).not.toHaveBeenCalled();

    expect(undo).toHaveBeenCalledWith({
      externalId: "6910",
      externalData: { applied: [] },
      winners: [gameId],
    });
    expect(updateOne).toHaveBeenCalledWith(
      { _id: "c1", status: "resolved" },
      {
        $set: expect.objectContaining({
          status: "pending",
          decision: null,
          winners: [],
          decidedBy: null,
        }),
      }
    );
    expect(events.conflictDecided).toHaveBeenCalledWith(
      expect.objectContaining({ externalId: "6910", state: "waiting" })
    );
    await expect(service.undo("vndb", "6910", ADMIN)).rejects.toBeInstanceOf(
      ConflictException
    );
  });

  it("deletes the game a Skip created, requeues it and stops the AI from adding it again", async () => {
    const { service, updateOne, deleteGame, setExternalData } = buildSkipUndo({
      externalData: {
        created: String(CREATED),
        aiVerdict: { gameIds: [], confidence: "high" },
      },
    });

    await service.undo("vndb", "8937", ADMIN);

    expect(deleteGame).toHaveBeenCalledWith(CREATED);
    expect(setExternalData).toHaveBeenCalledWith("vndb", [
      {
        externalId: "8937",
        externalData: {
          created: null,
          aiVerdict: expect.objectContaining({ undoneAt: expect.any(String) }),
        },
      },
    ]);
    expect(updateOne).toHaveBeenCalledWith(
      { _id: "c2", status: "absent" },
      { $set: expect.objectContaining({ status: "pending" }) }
    );
  });

  it("keeps a created game that someone already uses", async () => {
    const { service, deleteGame } = buildSkipUndo({
      externalData: { created: String(CREATED) },
      usedIds: [String(CREATED)],
    });

    await expect(service.undo("vndb", "8937", ADMIN)).rejects.toThrow(
      "Spider Solitaire"
    );
    expect(deleteGame).not.toHaveBeenCalled();
  });

  it("only requeues a Skip that reused a game already holding the entry", async () => {
    const { service, updateOne, deleteGame } = buildSkipUndo({
      externalData: { created: null },
    });

    await service.undo("vndb", "8937", ADMIN);

    expect(deleteGame).not.toHaveBeenCalled();
    expect(updateOne).toHaveBeenCalled();
  });

  it("refuses a Skip made before created games were recorded", async () => {
    const { service } = buildSkipUndo({ externalData: {} });

    await expect(service.undo("vndb", "8937", ADMIN)).rejects.toThrow(
      "before created games"
    );
  });

  it("refuses to undo a Skip of a source whose Skip adds no game", async () => {
    const service = createService({
      conflictsModel: {
        ...idleModel,
        findOne: () =>
          query({ _id: "c3", externalId: "1", status: "absent", winners: [] }),
      },
      handler: { ...createHandler(), rematch: jest.fn() },
    });

    await expect(service.undo("vndb", "1", ADMIN)).rejects.toThrow(
      "reopened rather than undone"
    );
  });

  it("undoes a match from what it changed, keeping fields edited since and games linked elsewhere", async () => {
    const gameId = new Types.ObjectId();
    const otherId = new Types.ObjectId();
    const gamesUpdate = jest.fn();
    const service = createService({
      conflictsModel: {
        ...idleModel,
        findOne: jest
          .fn()
          .mockReturnValueOnce(
            query({
              _id: "c5",
              externalId: "v1",
              status: "resolved",
              winners: [gameId, otherId],
              externalData: {
                changes: [
                  {
                    gameId: String(gameId),
                    before: { name: "Old", summary: "Old summary" },
                    after: {
                      name: "New",
                      summary: "New summary",
                      vndb: { vnId: "v1", syncedAt: "a" },
                      cover: "c.jpg",
                    },
                  },
                  {
                    gameId: String(otherId),
                    before: {},
                    after: { vndb: { vnId: "v1" } },
                  },
                ],
              },
            })
          )
          .mockReturnValue(query(null)),
        updateOne: jest.fn(),
      },
      gamesModel: {
        findById: jest
          .fn()
          .mockReturnValueOnce(
            query({
              _id: gameId,
              name: "New",
              summary: "Edited by an admin",
              vndb: { vnId: "v1", syncedAt: "b" },
              cover: "c.jpg",
            })
          )
          .mockReturnValueOnce(query({ _id: otherId, vndb: { vnId: "v2" } })),
        updateOne: gamesUpdate,
      },
    });

    await service.undo("vndb", "v1", ADMIN);

    expect(gamesUpdate).toHaveBeenCalledTimes(1);
    expect(gamesUpdate).toHaveBeenCalledWith(
      { _id: String(gameId) },
      {
        $set: { name: "Old", updatedAt: expect.any(String) },
        $unset: { vndb: "", cover: "" },
      }
    );
  });

  it("only unlinks the winners of a match made before changes were recorded", async () => {
    const gameId = new Types.ObjectId();
    const gamesUpdate = jest.fn();
    const service = createService({
      conflictsModel: {
        ...idleModel,
        findOne: jest
          .fn()
          .mockReturnValueOnce(
            query({
              _id: "c6",
              externalId: "v1",
              status: "resolved",
              winners: [gameId],
            })
          )
          .mockReturnValue(query(null)),
        updateOne: jest.fn(),
      },
      gamesModel: {
        findById: () => query({ _id: gameId, name: "X", vndb: { vnId: "v1" } }),
        updateOne: gamesUpdate,
      },
    });

    await service.undo("vndb", "v1", ADMIN);

    expect(gamesUpdate).toHaveBeenCalledWith(
      { _id: String(gameId) },
      { $set: { updatedAt: expect.any(String) }, $unset: { vndb: "" } }
    );
  });

  it("leaves decisions to the process that holds the apply lock", async () => {
    const handler = createHandler();
    const service = createService({
      conflictsModel: {
        ...idleModel,
        find: () => query([{ _id: "c4", externalId: "1", decision: "skip" }]),
        db: {
          collection: () => ({
            updateOne: jest.fn().mockRejectedValue({ code: 11000 }),
          }),
        },
      },
      handler,
    });

    await (
      service as unknown as {
        applyDecisions: (source: string) => Promise<void>;
      }
    ).applyDecisions("vndb");

    expect(handler.apply).not.toHaveBeenCalled();
  });

  it("refuses to reopen a source without a rematch", async () => {
    const service = createService({ conflictsModel: idleModel });

    await expect(service.reopen("vndb", "v1", ADMIN)).rejects.toBeInstanceOf(
      BadRequestException
    );
  });

  it("reopens only a skipped conflict, with fresh candidates", async () => {
    const gameId = new Types.ObjectId();
    const findOneAndUpdate = jest.fn().mockResolvedValue({ _id: "c1" });
    const events = createEvents();
    const service = createService({
      events,
      conflictsModel: { ...idleModel, findOneAndUpdate },
      handler: {
        ...createHandler(),
        rematch: jest.fn().mockResolvedValue([
          {
            game: { _id: String(gameId), slug: "dyna", name: "Dyna" },
            score: 1,
            breakdown: {},
          },
        ]),
      },
    });

    await service.reopen("vndb", "v1", ADMIN);

    const [filter, update] = findOneAndUpdate.mock.calls[0];

    expect(filter).toEqual({
      source: "vndb",
      externalId: "v1",
      status: "absent",
      decision: null,
    });
    expect(update.$set.status).toBe("pending");
    expect(update.$set.candidates[0].gameId).toEqual(gameId);
    expect(events.conflictDecided).toHaveBeenCalledWith(
      expect.objectContaining({ state: "waiting" })
    );
  });

  it("answers 409 when the conflict was not skipped", async () => {
    const service = createService({
      conflictsModel: {
        ...idleModel,
        findOneAndUpdate: jest.fn().mockResolvedValue(null),
      },
      handler: { ...createHandler(), rematch: jest.fn().mockResolvedValue([]) },
    });

    await expect(service.reopen("vndb", "v1", ADMIN)).rejects.toBeInstanceOf(
      ConflictException
    );
  });

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
        status: { $in: ["pending", "postponed", "dismissed"] },
        decision: null,
        "candidates.gameId": { $all: [new Types.ObjectId(gameId)] },
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

  it("refuses several games for a source that links an entry to one game", async () => {
    const service = createService({ conflictsModel: idleModel });

    await expect(
      service.decide(
        "vndb",
        "v1",
        {
          gameIds: [String(new Types.ObjectId()), String(new Types.ObjectId())],
        },
        ADMIN
      )
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("records every game of a multi-match decision", async () => {
    const gameIds = [new Types.ObjectId(), new Types.ObjectId()];
    const findOneAndUpdate = jest.fn(() =>
      query({ status: "pending", decision: "match" })
    );
    const service = createService({
      conflictsModel: { ...idleModel, findOneAndUpdate },
      handler: { ...createHandler(), isMultiMatch: true },
    });

    await service.decide("vndb", "v1", { gameIds: gameIds.map(String) }, ADMIN);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ "candidates.gameId": { $all: gameIds } }),
      {
        $set: expect.objectContaining({
          decision: "match",
          winner: gameIds[0],
          winners: gameIds,
        }),
      },
      { new: true }
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
      gamesModel: { find: () => query([]) },
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
          winners: [],
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
    const service = createService({
      handler,
      conflictsModel: { bulkWrite },
      gamesModel: { find: () => query([]) },
    });
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

    expect(bulkWrite.mock.lastCall[0][0].updateOne.update).toEqual({
      $set: { status: "resolved", winner: gameId, decision: null },
    });
  });

  it("marks a skip the source applied without a game as done, not as returned", async () => {
    const bulkWrite = jest.fn();
    const handler = {
      ...createHandler(new Map([["42", null]])),
      direction: "entries" as const,
    };
    const service = createService({
      handler,
      conflictsModel: { bulkWrite },
      gamesModel: { find: () => query([]) },
    });

    await service["applyBatch"](handler, [
      {
        _id: new Types.ObjectId(),
        externalId: "42",
        externalName: "A game",
        decision: "skip",
        winner: null,
      } as never,
    ]);

    expect(bulkWrite.mock.lastCall[0][0].updateOne.update).toEqual({
      $set: { status: "absent", winner: null, decision: null },
    });
  });

  it("records what a match changed and the game a Skip created, even on a retried batch", async () => {
    const gameId = new Types.ObjectId();
    const created = new Types.ObjectId();
    const retried = new Types.ObjectId();
    const existing = new Types.ObjectId();
    const decidedAt = new Date("2026-10-16T16:47:30.000Z");
    const handler = createHandler(
      new Map([
        ["v1", gameId],
        ["v2", created],
        ["v3", retried],
        ["v4", existing],
      ])
    );
    const service = createService({
      handler,
      conflictsModel: { bulkWrite: jest.fn() },
      gamesModel: {
        find: jest
          .fn()
          .mockReturnValueOnce(
            query([{ _id: gameId, name: "Old", updatedAt: 1 }])
          )
          .mockReturnValueOnce(
            query([
              { _id: gameId, name: "New", vndb: { vnId: "v1" }, updatedAt: 2 },
            ])
          )
          .mockReturnValueOnce(
            query([
              { _id: created, createdAt: "2026-10-16T16:58:00.000Z" },
              { _id: retried, createdAt: "2026-10-16T16:50:00.000Z" },
              { _id: existing, createdAt: "2024-01-01T00:00:00.000Z" },
            ])
          ),
      },
    });
    const setExternalData = jest.spyOn(service, "setExternalData");

    await service["applyBatch"](handler, [
      { externalId: "v1", decision: "match", winners: [gameId] },
      { externalId: "v2", decision: "skip", updatedAt: decidedAt },
      { externalId: "v3", decision: "skip", updatedAt: decidedAt },
      { externalId: "v4", decision: "skip", updatedAt: decidedAt },
    ] as never);

    expect(setExternalData).toHaveBeenCalledWith("vndb", [
      {
        externalId: "v1",
        externalData: {
          changes: [
            {
              gameId: String(gameId),
              before: { name: "Old" },
              after: { name: "New", vndb: { vnId: "v1" } },
            },
          ],
        },
      },
      { externalId: "v2", externalData: { created: String(created) } },
      { externalId: "v3", externalData: { created: String(retried) } },
      { externalId: "v4", externalData: { created: null } },
    ]);
  });

  it("prepends a game found by hand as a manual candidate", async () => {
    const gameId = new Types.ObjectId();
    const findOneAndUpdate = jest.fn().mockResolvedValue({ _id: "c1" });
    const service = createService({
      conflictsModel: { ...idleModel, findOneAndUpdate },
      gamesModel: {
        findById: () => query({ _id: gameId, name: "Dyna", slug: "dyna" }),
      },
    });

    await service.addCandidate("vndb", "v1", String(gameId));

    const [filter, update] = findOneAndUpdate.mock.calls[0];
    expect(filter).toMatchObject({
      status: "pending",
      decision: null,
      "candidates.gameId": { $ne: gameId },
    });
    expect(update.$push.candidates.$position).toBe(0);
    expect(update.$push.candidates.$each[0]).toMatchObject({
      gameId,
      name: "Dyna",
      score: 0,
      isManual: true,
    });
  });

  it("refuses a manual candidate on an entries-direction source", async () => {
    const service = createService({
      conflictsModel: idleModel,
      handler: { ...createHandler(), direction: "entries" },
    });

    await expect(
      service.addCandidate("vndb", "v1", String(new Types.ObjectId()))
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("refreshes an undecided conflict in place and inserts the missing ones", async () => {
    const bulkWrite = jest.fn().mockResolvedValue({});
    const insertMany = jest.fn().mockResolvedValue([]);
    const service = createService({
      conflictsModel: { ...idleModel, bulkWrite, insertMany },
    });
    const entries = [
      {
        id: "10379",
        name: "Titan Quest",
        score: 1,
        releaseYear: 2006,
        platforms: ["PC"],
        cover: "https://howlongtobeat.com/games/10379_Titan_Quest.jpg",
        url: "https://howlongtobeat.com/game/10379",
        details: [],
      },
    ];

    await service.refresh("hltb", [
      {
        externalId: "g1",
        externalName: "Titan Quest: Gold Edition",
        reason: "unverified-title",
        candidates: [],
        entries,
      },
    ]);

    const [[[op]]] = bulkWrite.mock.calls;
    expect(op.updateOne.filter).toEqual({
      source: "hltb",
      externalId: "g1",
      status: "pending",
      decision: null,
    });
    expect(op.updateOne.update.$set.entries).toEqual(entries);
    expect(insertMany).toHaveBeenCalledTimes(1);
  });

  it("rewrites the scored candidates of a games conflict and keeps the ones an admin added", async () => {
    const bulkWrite = jest.fn().mockResolvedValue({});
    const added = {
      gameId: new Types.ObjectId(),
      slug: "akira-1988",
      name: "Akira",
      score: 0,
      isManual: true,
    };
    const service = createService({
      conflictsModel: {
        ...idleModel,
        find: () => query([{ externalId: "8780", candidates: [added] }]),
        bulkWrite,
        insertMany: jest.fn().mockResolvedValue([]),
      },
    });
    const breakdown = {
      title: 4,
      companies: 2,
      date: 3,
      platforms: 1,
      genre: 0,
      type: 0,
    };

    await service.refresh("steam", [
      {
        externalId: "8780",
        externalName: "Akira",
        reason: "unverified-title",
        candidates: [
          {
            game: {
              _id: "507f1f77bcf86cd799439011",
              slug: "akira",
              name: "Akira",
            } as never,
            score: 10,
            breakdown,
            dateSignal: "confirms",
            descriptionSignal: "unknown",
            hasCompanyMismatch: false,
            isDistinctiveTitle: true,
            isMainTitleMatch: true,
            isCorroborated: true,
            isContradicted: false,
          },
        ],
      },
    ]);

    const [[[op]]] = bulkWrite.mock.calls;
    expect(op.updateOne.update.$set.candidates).toEqual([
      added,
      expect.objectContaining({ slug: "akira", score: 10, breakdown }),
    ]);
  });
});
