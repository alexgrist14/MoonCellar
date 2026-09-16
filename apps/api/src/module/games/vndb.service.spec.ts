import { BadRequestException, ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { of } from "rxjs";
import { VndbService } from "./services/vndb.service";
import { VNDB_REQUEST_DELAY_MS } from "./constants/vndb";
import { sleep } from "../../shared/utils";

jest.mock("../../shared/utils", () => ({
  ...jest.requireActual("../../shared/utils"),
  sleep: jest.fn(() => Promise.resolve()),
}));

const ADMIN = { _id: new Types.ObjectId(), userName: "alex" };

const query = (value: unknown) => ({
  select: () => query(value),
  limit: () => query(value),
  sort: () => query(value),
  lean: () => Promise.resolve(value),
});

const createReviewEvents = () => ({
  candidateDecided: jest.fn(),
  candidatesApplied: jest.fn(),
});

const createService = ({
  httpService = {},
  gamesModel = {},
  candidatesModel = {},
  reviewEvents = createReviewEvents(),
}: {
  httpService?: object;
  gamesModel?: object;
  candidatesModel?: object;
  reviewEvents?: ReturnType<typeof createReviewEvents>;
}) =>
  new VndbService(
    httpService as never,
    gamesModel as never,
    candidatesModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    reviewEvents as never
  );

describe("VndbService", () => {
  beforeEach(() => jest.mocked(sleep).mockClear());

  it("spaces concurrent VNDB requests instead of firing them together", async () => {
    const service = createService({
      httpService: { post: jest.fn(() => of({ data: { results: [] } })) },
    });

    await Promise.all([
      service["post"]("/vn", {}),
      service["post"]("/vn", {}),
    ]);

    const [, secondWait] = jest.mocked(sleep).mock.calls.map(([ms]) => ms);

    expect(secondWait).toBeGreaterThan(VNDB_REQUEST_DELAY_MS - 100);
  });

  it("records a decision only on an undecided VN among its candidates", async () => {
    const gameId = String(new Types.ObjectId());
    const findOneAndUpdate = jest.fn(() =>
      query({ status: "pending", decision: "match" })
    );
    const reviewEvents = createReviewEvents();
    const service = createService({
      reviewEvents,
      candidatesModel: {
        findOneAndUpdate,
        countDocuments: jest.fn().mockResolvedValue(0),
        findOne: () => query(null),
        find: () => query([]),
      },
    });

    await service.decideCandidate("v1", gameId, ADMIN);

    expect(findOneAndUpdate).toHaveBeenCalledWith(
      {
        vnId: "v1",
        status: "pending",
        decision: null,
        "candidates.gameId": new Types.ObjectId(gameId),
      },
      expect.anything(),
      { new: true }
    );
    expect(reviewEvents.candidateDecided).toHaveBeenCalledWith({
      vnId: "v1",
      state: "queued-match",
      decidedBy: "alex",
    });
  });

  it("refuses a decision on a VN another admin has already decided", async () => {
    const reviewEvents = createReviewEvents();
    const service = createService({
      reviewEvents,
      candidatesModel: {
        findOneAndUpdate: () => query(null),
        findOne: () =>
          query({
            status: "pending",
            decision: "skip",
            decidedBy: { userName: "maria" },
          }),
      },
    });

    const decision = service.decideCandidate("v1", null, ADMIN);

    await expect(decision).rejects.toBeInstanceOf(ConflictException);
    await expect(decision).rejects.toThrow("maria has already decided v1");
    expect(reviewEvents.candidateDecided).not.toHaveBeenCalled();
  });

  it("rejects a match with a game that is not a candidate", async () => {
    const service = createService({
      candidatesModel: {
        findOneAndUpdate: () => query(null),
        findOne: () => query({ status: "pending", decision: null }),
      },
    });

    await expect(
      service.decideCandidate("v1", String(new Types.ObjectId()), ADMIN)
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it("returns a match with a deleted game to review without creating a game", async () => {
    const bulkWrite = jest.fn();
    const insertVndbGame = jest.fn();
    const reviewEvents = createReviewEvents();
    const service = createService({
      reviewEvents,
      gamesModel: { find: () => query([]), updateMany: jest.fn() },
      candidatesModel: { bulkWrite },
    });
    const _id = new Types.ObjectId();

    Object.assign(service, {
      insertVndbGame,
      getVndbTitles: jest.fn().mockResolvedValue({ titles: [{ id: "v1" }] }),
    });

    const applied = await service["applyDecisionBatch"]([
      {
        _id,
        vnId: "v1",
        vnName: "Visual novel",
        decision: "match",
        winner: new Types.ObjectId(),
      } as never,
    ]);

    expect(applied).toBe(0);
    expect(insertVndbGame).toHaveBeenCalledWith([]);
    expect(bulkWrite.mock.calls[0][0][0].updateOne).toEqual({
      filter: { _id, status: "pending", decision: "match" },
      update: { $set: { decision: null, winner: null, decidedBy: null } },
    });
    expect(reviewEvents.candidatesApplied).toHaveBeenCalledWith({
      vnIds: ["v1"],
    });
  });
});
