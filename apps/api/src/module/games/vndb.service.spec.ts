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
  conflicts = {},
}: {
  httpService?: object;
  gamesModel?: object;
  conflicts?: object;
}) =>
  new VndbService(
    httpService as never,
    gamesModel as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    conflicts as never,
    {} as never
  );

describe("VndbService", () => {
  beforeEach(() => jest.mocked(sleep).mockClear());

  it("returns a match with a deleted game to review without creating a game", async () => {
    const insertVndbGame = jest.fn();
    const service = createService({
      gamesModel: { find: () => query([]), updateMany: jest.fn() },
    });

    Object.assign(service, {
      insertVndbGame,
      getVndbTitles: jest.fn().mockResolvedValue({ titles: [{ id: "v1" }] }),
    });

    const applied = await service["applyConflictDecisions"]([
      {
        externalId: "v1",
        externalName: "Visual novel",
        decision: "match",
        winner: new Types.ObjectId(),
        winnerEntryId: null,
      },
    ]);

    expect(applied.size).toBe(0);
    expect(insertVndbGame).toHaveBeenCalledWith([]);
  });

  it("spaces concurrent VNDB requests instead of firing them together", async () => {
    const service = createService({
      httpService: { post: jest.fn(() => of({ data: { results: [] } })) },
    });

    await Promise.all([service["post"]("/vn", {}), service["post"]("/vn", {})]);

    const [, secondWait] = jest.mocked(sleep).mock.calls.map(([ms]) => ms);

    expect(secondWait).toBeGreaterThan(VNDB_REQUEST_DELAY_MS - 100);
  });
});
