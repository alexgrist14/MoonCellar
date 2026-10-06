import { Types } from "mongoose";
import { PlaythroughsService } from "./services/playthroughs.service";

jest.mock("../../shared/utils/rich-text.utils", () => ({
  sanitizeRichText: (html?: string) => html,
}));

const basePlay = {
  _id: new Types.ObjectId(),
  userId: new Types.ObjectId(),
  gameId: new Types.ObjectId(),
  category: "completed",
  date: "2026-09-06",
  time: 5,
  comment: "<p>Loved it</p>",
  platformId: new Types.ObjectId(),
  isMastered: false,
};

const platformId = new Types.ObjectId();

const platformsModel = (name = "3DO Interactive Multiplayer") => ({
  findById: () => ({
    orFail: () => Promise.resolve({ _id: platformId, name }),
  }),
});

const state = {
  category: "completed",
  isMastered: false,
  platformId: platformId.toString(),
  platform: "3DO Interactive Multiplayer",
  date: "2026-09-06",
  time: 5,
  hasReview: false,
};

const createService = (playthroughsModel: object) => {
  const recordUserLog = jest.fn();
  const users = { updateOne: jest.fn() };
  const service = new PlaythroughsService(
    playthroughsModel as never,
    platformsModel() as never,
    { recordUserLog } as never,
    users as never
  );

  return { service, recordUserLog, users };
};

describe("PlaythroughsService logs", () => {
  it("logs the whole state without the comment when a playthrough is added", async () => {
    const { service, recordUserLog } = createService({
      create: jest.fn(() => Promise.resolve(basePlay)),
    });

    await service.savePlaythrough(basePlay as never);

    expect(recordUserLog).toHaveBeenCalledWith({
      userId: basePlay.userId.toString(),
      gameId: basePlay.gameId.toString(),
      playthrough: {
        playthroughId: basePlay._id.toString(),
        action: "added",
        after: state,
      },
    });
  });

  it("logs the state before and after an update", async () => {
    const { service, recordUserLog } = createService({
      findById: () => ({
        orFail: () => Promise.resolve({ ...basePlay, time: 2, date: "" }),
      }),
      findOneAndUpdate: jest.fn(() =>
        Promise.resolve({ ...basePlay, isMastered: true })
      ),
    });

    await service.updatePlaythrough(basePlay._id, basePlay as never);

    expect(recordUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        playthrough: {
          playthroughId: basePlay._id.toString(),
          action: "updated",
          before: { ...state, date: undefined, time: 2 },
          after: { ...state, isMastered: true },
        },
      })
    );
  });

  it("marks a public note as a review", async () => {
    const { service, recordUserLog } = createService({
      findById: () => ({ orFail: () => Promise.resolve(basePlay) }),
      findOneAndUpdate: jest.fn(() =>
        Promise.resolve({ ...basePlay, isPublic: true })
      ),
    });

    await service.updatePlaythrough(basePlay._id, basePlay as never);

    expect(recordUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        playthrough: expect.objectContaining({
          before: state,
          after: { ...state, hasReview: true },
        }),
      })
    );
  });

  it("logs the removed state when a playthrough is deleted", async () => {
    const { service, recordUserLog } = createService({
      findOneAndDelete: jest.fn(() =>
        Promise.resolve({ ...basePlay, isMastered: true })
      ),
    });

    await service.deletePlaythrough(basePlay._id);

    expect(recordUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        playthrough: {
          playthroughId: basePlay._id.toString(),
          action: "removed",
          before: { ...state, isMastered: true },
        },
      })
    );
  });
});
