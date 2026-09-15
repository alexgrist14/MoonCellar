import { RolesEnum } from "@mooncellar/schemas";
import { ROLES_KEY } from "../roles/roles.decorator";
import { RolesGuard } from "../roles/roles.guard";
import { CommentReportsController } from "./controllers/comment-reports.controller";

jest.mock("../../shared/utils/rich-text.utils", () => ({
  sanitizeRichText: jest.fn(),
}));

describe("Comment reports moderation access", () => {
  it("requires a signed-in admin for the whole controller", () => {
    const guards = Reflect.getMetadata("__guards__", CommentReportsController);

    expect(guards).toHaveLength(2);
    expect(guards).toContain(RolesGuard);
    expect(Reflect.getMetadata(ROLES_KEY, CommentReportsController)).toEqual([
      RolesEnum.ADMIN,
    ]);
  });

  it.each([
    ["getReports", CommentReportsController.prototype.getReports],
    ["resolve", CommentReportsController.prototype.resolve],
  ])("does not override the admin requirement on %s", (_name, handler) => {
    expect(Reflect.getMetadata("__guards__", handler)).toBeUndefined();
    expect(Reflect.getMetadata(ROLES_KEY, handler)).toBeUndefined();
  });
});
