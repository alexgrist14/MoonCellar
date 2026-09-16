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

const platformsModel = (name = "3DO Interactive Multiplayer") => ({
  findById: () => ({ orFail: () => Promise.resolve({ name }) }),
});

const createService = (playthroughsModel: object) => {
  const createUserLog = jest.fn();
  const service = new PlaythroughsService(
    playthroughsModel as never,
    platformsModel() as never,
    { createUserLog } as never
  );

  return { service, createUserLog };
};

describe("PlaythroughsService logs", () => {
  it("logs every field except the comment when a playthrough is added", async () => {
    const { service, createUserLog } = createService({
      create: jest.fn(() => Promise.resolve(basePlay)),
    });

    await service.savePlaythrough(basePlay as never);

    expect(createUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        segment: "added",
        text:
          "<b>Added game to playthroughs</b>" +
          '<div style="font-size: 12px">Status: Completed' +
          "<br/>Console: 3DO Interactive Multiplayer" +
          "<br/>Date: 06.09.2026<br/>Time: 5h</div>",
      })
    );
  });

  it("logs only the changed fields when a playthrough is updated", async () => {
    const { service, createUserLog } = createService({
      findById: () => ({
        orFail: () => Promise.resolve({ ...basePlay, time: 2 }),
      }),
      findOneAndUpdate: jest.fn(() => Promise.resolve(basePlay)),
    });

    await service.updatePlaythrough(basePlay._id, basePlay as never);

    expect(createUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        segment: "updated",
        text:
          "<b>Updated playthrough</b>" +
          '<div style="font-size: 12px">Time: 5h</div>',
      })
    );
  });

  it("marks a cleared field as removed", async () => {
    const { service, createUserLog } = createService({
      findById: () => ({ orFail: () => Promise.resolve(basePlay) }),
      findOneAndUpdate: jest.fn(() =>
        Promise.resolve({ ...basePlay, date: undefined })
      ),
    });

    await service.updatePlaythrough(basePlay._id, basePlay as never);

    expect(createUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        text:
          "<b>Updated playthrough</b>" +
          '<div style="font-size: 12px">Date: —</div>',
      })
    );
  });

  it("logs a bare header when only the comment changed", async () => {
    const { service, createUserLog } = createService({
      findById: () => ({
        orFail: () => Promise.resolve({ ...basePlay, comment: "<p>Old</p>" }),
      }),
      findOneAndUpdate: jest.fn(() => Promise.resolve(basePlay)),
    });

    await service.updatePlaythrough(basePlay._id, basePlay as never);

    expect(createUserLog).toHaveBeenCalledWith(
      expect.objectContaining({ text: "<b>Updated playthrough</b>" })
    );
  });

  it("logs the whole playthrough without its comment when it is removed", async () => {
    const { service, createUserLog } = createService({
      findOneAndDelete: jest.fn(() =>
        Promise.resolve({ ...basePlay, isMastered: true })
      ),
    });

    await service.deletePlaythrough(basePlay._id);

    expect(createUserLog).toHaveBeenCalledWith(
      expect.objectContaining({
        segment: "removed",
        text:
          "<b>Removed playthrough</b>" +
          '<div style="font-size: 12px">Status: Mastered' +
          "<br/>Console: 3DO Interactive Multiplayer" +
          "<br/>Date: 06.09.2026<br/>Time: 5h</div>",
      })
    );
  });
});
