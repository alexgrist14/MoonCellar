import { BadRequestException } from "@nestjs/common";
import { Types } from "mongoose";
import { of } from "rxjs";
import { VndbService } from "./services/vndb.service";
import { VNDB_REQUEST_DELAY_MS } from "./constants/vndb";
import { sleep } from "../../shared/utils";

jest.mock("../../shared/utils", () => ({
  ...jest.requireActual("../../shared/utils"),
  sleep: jest.fn(() => Promise.resolve()),
}));

const query = (value: unknown) => ({
  select: () => query(value),
  limit: () => query(value),
  sort: () => query(value),
  lean: () => Promise.resolve(value),
});

const createService = ({
  httpService = {},
  gamesModel = {},
  candidatesModel = {},
}: {
  httpService?: object;
  gamesModel?: object;
  candidatesModel?: object;
}) =>
  new VndbService(
    httpService as never,
    gamesModel as never,
    candidatesModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never
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

  it("rejects a match with a game that is not a candidate", async () => {
    const updateOne = jest.fn();
    const service = createService({
      candidatesModel: {
        findOne: () =>
          query({
            _id: new Types.ObjectId(),
            candidates: [{ gameId: new Types.ObjectId() }],
          }),
        updateOne,
      },
    });

    await expect(
      service.decideCandidate("v1", String(new Types.ObjectId()))
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(updateOne).not.toHaveBeenCalled();
  });

  it("returns a match with a deleted game to review without creating a game", async () => {
    const bulkWrite = jest.fn();
    const insertVndbGame = jest.fn();
    const service = createService({
      gamesModel: { find: () => query([]), updateMany: jest.fn() },
      candidatesModel: { bulkWrite },
    });

    Object.assign(service, {
      insertVndbGame,
      getVndbTitles: jest.fn().mockResolvedValue({ titles: [{ id: "v1" }] }),
    });

    const applied = await service["applyDecisionBatch"]([
      {
        _id: new Types.ObjectId(),
        vnId: "v1",
        vnName: "Visual novel",
        decision: "match",
        winner: new Types.ObjectId(),
      } as never,
    ]);

    expect(applied).toBe(0);
    expect(insertVndbGame).toHaveBeenCalledWith([]);
    expect(bulkWrite.mock.calls[0][0][0].updateOne.update).toEqual({
      $set: { decision: null, winner: null },
    });
  });
});
