import { BadRequestException, NotFoundException } from "@nestjs/common";
import mongoose from "mongoose";
import { CommentReportsService } from "./comment-reports.service";

jest.mock("../../../shared/utils/rich-text.utils", () => ({
  sanitizeRichText: jest.fn(),
}));

const COMMENT_ID = "0123456789abcdef01234567";
const moderator = {
  _id: new mongoose.Types.ObjectId("fedcba9876543210fedcba98"),
  roles: ["admin"],
};

const createService = (statuses: (string | null)[]) => {
  const findById = jest.fn();

  statuses.forEach((status) =>
    findById.mockReturnValueOnce({
      lean: jest.fn().mockResolvedValue(status ? { status } : null),
    })
  );

  const Comments = { findById, updateOne: jest.fn().mockResolvedValue({}) };
  const comments = {
    updateStatus: jest.fn().mockResolvedValue({}),
    deleteComment: jest.fn().mockResolvedValue({}),
    resolveReports: jest.fn().mockResolvedValue(undefined),
  };
  const service = new CommentReportsService(
    {} as never,
    Comments as never,
    {} as never,
    comments as never,
    {} as never
  );

  return { service, Comments, comments };
};

const resolve = (service: CommentReportsService, action: string) =>
  service.resolve(COMMENT_ID, action as never, moderator as never);

describe("CommentReportsService.resolve", () => {
  it("hides a visible comment and closes its reports as hidden", async () => {
    const { service, Comments, comments } = createService([
      "visible",
      "hidden",
    ]);

    await expect(resolve(service, "hide")).resolves.toEqual({
      status: "hidden",
    });
    expect(comments.updateStatus).toHaveBeenCalledWith(
      COMMENT_ID,
      "hidden",
      moderator
    );
    expect(comments.resolveReports).toHaveBeenCalledWith(
      new mongoose.Types.ObjectId(COMMENT_ID),
      "hidden",
      moderator._id
    );
    expect(Comments.updateOne).toHaveBeenCalledWith(
      { _id: new mongoose.Types.ObjectId(COMMENT_ID) },
      { $set: { reportsCount: 0 } },
      { timestamps: false }
    );
  });

  it("deletes the comment and closes its reports as deleted", async () => {
    const { service, comments } = createService(["visible", "deleted"]);

    await expect(resolve(service, "delete")).resolves.toEqual({
      status: "deleted",
    });
    expect(comments.deleteComment).toHaveBeenCalledWith(COMMENT_ID, moderator);
    expect(comments.resolveReports).toHaveBeenCalledWith(
      expect.anything(),
      "deleted",
      moderator._id
    );
  });

  it("leaves a comment that is already deleted alone", async () => {
    const { service, comments } = createService(["deleted", "deleted"]);

    await expect(resolve(service, "hide")).resolves.toEqual({
      status: "deleted",
    });
    expect(comments.updateStatus).not.toHaveBeenCalled();
    expect(comments.deleteComment).not.toHaveBeenCalled();
    expect(comments.resolveReports).toHaveBeenCalledWith(
      expect.anything(),
      "deleted",
      moderator._id
    );
  });

  it("dismisses the reports without touching the comment", async () => {
    const { service, comments } = createService(["visible", "visible"]);

    await expect(resolve(service, "dismiss")).resolves.toEqual({
      status: "visible",
    });
    expect(comments.updateStatus).not.toHaveBeenCalled();
    expect(comments.deleteComment).not.toHaveBeenCalled();
    expect(comments.resolveReports).toHaveBeenCalledWith(
      expect.anything(),
      "dismissed",
      moderator._id
    );
  });

  it("rejects a comment that does not exist", async () => {
    const { service, comments } = createService([null]);

    await expect(resolve(service, "dismiss")).rejects.toBeInstanceOf(
      NotFoundException
    );
    expect(comments.resolveReports).not.toHaveBeenCalled();
  });

  it("rejects a malformed comment id", async () => {
    const { service } = createService([]);

    await expect(
      service.resolve("not-an-id", "dismiss", moderator as never)
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
