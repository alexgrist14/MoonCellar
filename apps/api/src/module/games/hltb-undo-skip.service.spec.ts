import mongoose from "mongoose";
import { HltbService } from "./services/hltb.service";

const CREATED = new mongoose.Types.ObjectId();

const buildService = ({
  game = { _id: CREATED, name: "Spider Solitaire" },
  usedIds = [] as string[],
} = {}) => {
  const distinct = jest.fn((_field: string, filter: Record<string, unknown>) =>
    Promise.resolve(
      JSON.stringify(filter).includes(String(CREATED)) ? usedIds : []
    )
  );
  const gamesModel = {
    findById: () => ({
      select: () => ({ lean: () => Promise.resolve(game) }),
    }),
    db: { collection: () => ({ distinct }) },
  };
  const conflicts = { setExternalData: jest.fn().mockResolvedValue(undefined) };
  const gamesService = { deleteGame: jest.fn().mockResolvedValue(undefined) };
  const service = new HltbService(
    gamesModel as never,
    {} as never,
    {
      setContext: jest.fn(),
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
    } as never,
    {} as never,
    conflicts as never,
    gamesService as never
  );
  const undoSkip = (externalData: Record<string, unknown>) =>
    (
      service as unknown as {
        undoSkippedConflict: (decision: object) => Promise<void>;
      }
    ).undoSkippedConflict({ externalId: "8937", externalData });

  return { undoSkip, conflicts, gamesService };
};

describe("HLTB Skip undo", () => {
  it("deletes the game the Skip created and stops the AI from adding it again", async () => {
    const { undoSkip, conflicts, gamesService } = buildService();

    await undoSkip({
      created: String(CREATED),
      aiVerdict: { gameIds: [], confidence: "high" },
    });

    expect(gamesService.deleteGame).toHaveBeenCalledWith(CREATED);
    expect(conflicts.setExternalData).toHaveBeenCalledWith("hltb", [
      {
        externalId: "8937",
        externalData: {
          created: null,
          aiVerdict: expect.objectContaining({ undoneAt: expect.any(String) }),
        },
      },
    ]);
  });

  it("keeps a created game that someone already uses", async () => {
    const { undoSkip, gamesService } = buildService({
      usedIds: [String(CREATED)],
    });

    await expect(undoSkip({ created: String(CREATED) })).rejects.toThrow(
      "Spider Solitaire"
    );
    expect(gamesService.deleteGame).not.toHaveBeenCalled();
  });

  it("only requeues a Skip that reused a game already holding the entry", async () => {
    const { undoSkip, gamesService } = buildService();

    await undoSkip({ created: null });

    expect(gamesService.deleteGame).not.toHaveBeenCalled();
  });

  it("refuses a Skip made before created games were recorded", async () => {
    const { undoSkip } = buildService();

    await expect(undoSkip({})).rejects.toThrow("before created games");
  });
});
