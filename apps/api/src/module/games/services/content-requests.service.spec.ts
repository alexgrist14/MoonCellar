import { ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { POSSIBLE_DUPLICATES_MESSAGE } from "@mooncellar/schemas";
import { ContentRequestsService } from "./content-requests.service";
import { getS3CdnUrl } from "../../../shared/s3";

const ADMIN_ID = String(new Types.ObjectId());

const query = (value: unknown) => {
  const chain = {
    select: () => chain,
    limit: () => chain,
    sort: () => chain,
    skip: () => chain,
    lean: () => Promise.resolve(value),
  };

  return chain;
};

interface IStoredRequest {
  _id: Types.ObjectId;
  kind: string;
  action: string;
  status: string;
  targetId: Types.ObjectId | null;
  payload: Record<string, unknown>;
  userId: Types.ObjectId;
  claimedAt: Date | null;
  [key: string]: unknown;
}

const isOpen = (stored: IStoredRequest, filter: Record<string, unknown>) =>
  (!filter.status || stored.status === filter.status) &&
  (!filter.$or || stored.claimedAt === null) &&
  (!("claimedAt" in filter) || stored.claimedAt === filter.claimedAt);

const tick = () => new Promise((resolve) => setImmediate(resolve));

const createRequestsModel = (stored: IStoredRequest) => ({
  stored,
  findById: () => query({ ...stored }),
  findOneAndUpdate: jest.fn(
    async (
      filter: Record<string, unknown>,
      update: { $set: Record<string, unknown> }
    ) => {
      await tick();

      if (!isOpen(stored, filter)) return null;

      Object.assign(stored, update.$set);

      return { ...stored };
    }
  ),
  updateOne: jest.fn(
    async (
      filter: Record<string, unknown>,
      update: { $set: Record<string, unknown> }
    ) => {
      await tick();

      if (!isOpen(stored, filter)) return { matchedCount: 0 };

      Object.assign(stored, update.$set);

      return { matchedCount: 1 };
    }
  ),
});

const createRequest = (
  overrides: Partial<IStoredRequest> = {}
): IStoredRequest => ({
  _id: new Types.ObjectId(),
  kind: "character",
  action: "add",
  status: "pending",
  targetId: null,
  payload: { name: "Alice" },
  userId: new Types.ObjectId(),
  claimedAt: null,
  ...overrides,
});

const createService = ({
  request,
  games = {},
  characters = {},
  fileService = {},
  gameMatcher = {},
}: {
  request: IStoredRequest;
  games?: object;
  characters?: object;
  fileService?: object;
  gameMatcher?: object;
}) => {
  const requests = createRequestsModel(request);
  const charactersModel = {
    find: () => query([]),
    findById: () => query(null),
    exists: jest.fn().mockResolvedValue(null),
    create: jest.fn(async () => {
      await tick();
    }),
    updateOne: jest.fn().mockResolvedValue({ matchedCount: 1 }),
    findByIdAndDelete: jest.fn(() => query(null)),
    ...characters,
  };
  const gamesModel = {
    find: () => query([]),
    findById: () => query(null),
    exists: jest.fn().mockResolvedValue(null),
    findByIdAndDelete: jest.fn(() => query(null)),
    ...games,
  };
  const files = {
    uploadRemoteImage: jest.fn(),
    deleteFiles: jest.fn().mockResolvedValue([]),
    ...fileService,
  };
  const service = new ContentRequestsService(
    requests as never,
    gamesModel as never,
    charactersModel as never,
    { find: () => query([]) } as never,
    { find: () => query([]) } as never,
    files as never,
    { submitUrl: jest.fn() } as never,
    {} as never,
    {} as never,
    {} as never,
    {
      assertNoDuplicates: jest.fn().mockResolvedValue(undefined),
      ...gameMatcher,
    } as never
  );

  return { service, requests, charactersModel, gamesModel, files };
};

describe("ContentRequestsService.decide", () => {
  it("lets only one of two concurrent approvals create the entry", async () => {
    const request = createRequest();
    const { service, charactersModel } = createService({ request });

    const results = await Promise.allSettled([
      service.decide(ADMIN_ID, String(request._id), { decision: "approve" }),
      service.decide(ADMIN_ID, String(request._id), { decision: "approve" }),
    ]);

    expect(results.map(({ status }) => status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(
      (
        results.find(
          ({ status }) => status === "rejected"
        ) as PromiseRejectedResult
      ).reason
    ).toBeInstanceOf(ConflictException);
    expect(charactersModel.create).toHaveBeenCalledTimes(1);
    expect(request.status).toBe("approved");
    expect(request.claimedAt).toBeNull();
  });

  it("answers 409 to the reject that loses the race", async () => {
    const request = createRequest();
    const { service } = createService({ request });

    const results = await Promise.allSettled([
      service.decide(ADMIN_ID, String(request._id), {
        decision: "reject",
        reason: "No sources",
      }),
      service.decide(ADMIN_ID, String(request._id), {
        decision: "reject",
        reason: "Duplicate",
      }),
    ]);

    expect(results.map(({ status }) => status).sort()).toEqual([
      "fulfilled",
      "rejected",
    ]);
    expect(request.status).toBe("rejected");
  });

  it("refuses to reject a request another admin is approving", async () => {
    const request = createRequest({ claimedAt: new Date() });
    const { service } = createService({ request });

    await expect(
      service.decide(ADMIN_ID, String(request._id), {
        decision: "reject",
        reason: "No",
      })
    ).rejects.toBeInstanceOf(ConflictException);
    expect(request.status).toBe("pending");
  });

  it("deletes the created game and its images and releases the request when approval fails", async () => {
    const request = createRequest({
      kind: "game",
      payload: { name: "Celeste", cover: "https://example.com/cover.jpg" },
    });
    const cover = `${getS3CdnUrl()}/covers/abc/def.jpg`;
    let createdId: Types.ObjectId | undefined;
    const findByIdAndDelete = jest.fn((id: Types.ObjectId) =>
      query({ _id: id, cover })
    );
    const { service, files } = createService({
      request,
      games: {
        create: jest.fn(async (doc: Record<string, unknown>) => {
          createdId = new Types.ObjectId();
          return { toObject: () => ({ ...doc, _id: createdId }) };
        }),
        findById: () => query({ _id: createdId, name: "Celeste" }),
        updateOne: jest.fn().mockRejectedValue(new Error("write failed")),
        findByIdAndDelete,
      },
      fileService: {
        uploadRemoteImage: jest.fn().mockResolvedValue(cover),
      },
    });

    await expect(
      service.decide(ADMIN_ID, String(request._id), { decision: "approve" })
    ).rejects.toThrow("write failed");

    expect(findByIdAndDelete).toHaveBeenCalledWith(createdId);
    expect(files.deleteFiles).toHaveBeenCalledWith(["abc/def.jpg"], "covers");
    expect(request.status).toBe("pending");
    expect(request.claimedAt).toBeNull();
  });

  it("adds proposed games to a character's list instead of replacing it", async () => {
    const characterId = new Types.ObjectId();
    const proposed = new Types.ObjectId();
    const request = createRequest({
      action: "update",
      targetId: characterId,
      payload: { gameIds: [String(proposed)], gender: "Female" },
    });
    const { service, charactersModel } = createService({
      request,
      characters: {
        findById: () =>
          query({ _id: characterId, gameIds: [new Types.ObjectId()] }),
      },
      games: { find: () => query([{ _id: proposed }]) },
    });

    await service.decide(ADMIN_ID, String(request._id), {
      decision: "approve",
    });

    const [, update] = charactersModel.updateOne.mock.calls[0];

    expect(update.$set).not.toHaveProperty("gameIds");
    expect(update.$set.gender).toBe("Female");
    expect(update.$addToSet.gameIds.$each.map(String)).toEqual([
      String(proposed),
    ]);
  });

  it("answers 409 with candidates for a likely duplicate character and creates it on force", async () => {
    const request = createRequest({ payload: { name: "Alice", akas: ["Al"] } });
    const existing = {
      _id: new Types.ObjectId(),
      name: "alice",
      slug: "alice",
    };
    const { service, charactersModel } = createService({
      request,
      characters: { find: () => query([existing]) },
    });

    const error = await service
      .decide(ADMIN_ID, String(request._id), { decision: "approve" })
      .catch((err: ConflictException) => err);

    expect(error).toBeInstanceOf(ConflictException);
    expect((error as ConflictException).getResponse()).toEqual({
      message: POSSIBLE_DUPLICATES_MESSAGE,
      duplicates: [
        { _id: String(existing._id), name: "alice", slug: "alice", score: 1 },
      ],
    });
    expect(charactersModel.create).not.toHaveBeenCalled();
    expect(request.status).toBe("pending");
    expect(request.claimedAt).toBeNull();

    await service.decide(ADMIN_ID, String(request._id), {
      decision: "approve",
      force: true,
    });

    expect(charactersModel.create).toHaveBeenCalledTimes(1);
    expect(request.status).toBe("approved");
  });
});
