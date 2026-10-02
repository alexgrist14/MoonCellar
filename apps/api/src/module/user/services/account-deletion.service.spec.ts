import { ForbiddenException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { AccountDeletionService } from "./account-deletion.service";

const USER_ID = "0123456789abcdef01234567";
const userId = new mongoose.Types.ObjectId(USER_ID);
const gameId = new mongoose.Types.ObjectId();
const parentId = new mongoose.Types.ObjectId();
const commentId = new mongoose.Types.ObjectId();
const likedListId = new mongoose.Types.ObjectId();
const votedCommentId = new mongoose.Types.ObjectId();

const query = <T>(value: T) => {
  const chain = {
    select: () => chain,
    lean: () => Promise.resolve(value),
  };
  return chain;
};

const model = (overrides: Record<string, unknown> = {}) => ({
  find: jest.fn(() => query([])),
  findById: jest.fn(() => query(null)),
  distinct: jest.fn().mockResolvedValue([]),
  deleteMany: jest.fn().mockResolvedValue({}),
  deleteOne: jest.fn().mockResolvedValue({}),
  updateMany: jest.fn().mockResolvedValue({}),
  updateOne: jest.fn().mockResolvedValue({}),
  ...overrides,
});

const createService = async () => {
  const password = await bcrypt.hash("correct-password", 4);
  const models = {
    users: model({
      findById: jest.fn(() =>
        query({
          password,
          avatar: "https://cdn/avatars/a.png",
          background: null,
        })
      ),
    }),
    logs: model(),
    ratings: model({ distinct: jest.fn().mockResolvedValue([gameId]) }),
    playthroughs: model(),
    comments: model({
      find: jest.fn(() =>
        query([{ _id: commentId, parentId, status: "visible" }])
      ),
    }),
    votes: model({
      find: jest.fn(() =>
        query([{ target: "comment", targetId: votedCommentId }])
      ),
    }),
    reports: model(),
    lists: model(),
    listLikes: model({
      distinct: jest.fn().mockResolvedValue([likedListId]),
    }),
    notifications: model(),
    pushSubscriptions: model(),
  };
  const ratingsService = {
    recalculateAverageRating: jest.fn().mockResolvedValue(undefined),
  };
  const fileService = {
    getKeyFromUrl: jest.fn((_folder: string, url?: string | null) =>
      url ? "a.png" : null
    ),
    deleteFile: jest.fn().mockResolvedValue({}),
  };
  const service = new AccountDeletionService(
    models.users as never,
    models.logs as never,
    models.ratings as never,
    models.playthroughs as never,
    models.comments as never,
    models.votes as never,
    models.reports as never,
    models.lists as never,
    models.listLikes as never,
    models.notifications as never,
    models.pushSubscriptions as never,
    ratingsService as never,
    fileService as never
  );

  return { service, models, ratingsService, fileService };
};

const writes = (models: Record<string, ReturnType<typeof model>>) =>
  Object.values(models).flatMap((m) => [
    ...m.deleteMany.mock.calls,
    ...m.deleteOne.mock.calls,
    ...m.updateMany.mock.calls,
    ...m.updateOne.mock.calls,
  ]);

describe("AccountDeletionService.deleteOwnAccount", () => {
  it("refuses a wrong password and writes nothing", async () => {
    const { service, models, fileService } = await createService();

    await expect(
      service.deleteOwnAccount(USER_ID, "wrong-password")
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(writes(models)).toHaveLength(0);
    expect(fileService.deleteFile).not.toHaveBeenCalled();
  });

  it("deletes only the user's data and repairs shared counters", async () => {
    const { service, models, ratingsService, fileService } =
      await createService();
    const anyId = { $in: [userId, USER_ID] };

    await service.deleteOwnAccount(USER_ID, "correct-password");

    expect(models.ratings.deleteMany).toHaveBeenCalledWith({ userId: anyId });
    expect(ratingsService.recalculateAverageRating).toHaveBeenCalledWith(
      gameId
    );
    expect(models.logs.deleteMany).toHaveBeenCalledWith({ userId: anyId });
    expect(models.playthroughs.deleteMany).toHaveBeenCalledWith({
      userId: anyId,
    });
    expect(models.votes.deleteMany).toHaveBeenCalledWith({ userId });
    expect(models.comments.updateMany).toHaveBeenCalledWith(
      { _id: { $in: [votedCommentId] } },
      { $inc: { likesCount: -1 } },
      { timestamps: false }
    );
    expect(models.comments.updateMany).toHaveBeenCalledWith(
      { _id: { $in: [commentId] } },
      { $set: { status: "deleted", body: "", reportsCount: 0 } }
    );
    expect(models.comments.updateOne).toHaveBeenCalledWith(
      { _id: parentId },
      { $inc: { repliesCount: -1 } },
      { timestamps: false }
    );
    expect(models.listLikes.deleteMany).toHaveBeenCalledWith({ userId });
    expect(models.lists.updateMany).toHaveBeenCalledWith(
      { _id: { $in: [likedListId] } },
      { $inc: { likesCount: -1 } },
      { timestamps: false }
    );
    expect(models.notifications.deleteMany).toHaveBeenCalledWith({ userId });
    expect(models.notifications.updateMany).toHaveBeenCalledWith(
      { _id: { $in: [] } },
      { $pull: { actorIds: userId } },
      { timestamps: false }
    );
    expect(models.pushSubscriptions.deleteMany).toHaveBeenCalledWith({
      userId,
    });
    expect(models.users.updateMany).toHaveBeenCalledWith(
      { $or: [{ followings: userId }, { followers: userId }] },
      { $pull: { followings: userId, followers: userId } },
      { timestamps: false }
    );
    expect(models.users.deleteOne).toHaveBeenCalledWith({ _id: userId });
    expect(fileService.deleteFile).toHaveBeenCalledTimes(1);

    const unscoped = writes(models).filter(
      ([filter]) => !filter || Object.keys(filter as object).length === 0
    );
    expect(unscoped).toHaveLength(0);
  });
});
