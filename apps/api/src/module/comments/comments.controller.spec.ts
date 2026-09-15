import { RolesEnum } from "@mooncellar/schemas";
import { ROLES_KEY } from "../roles/roles.decorator";
import { OptionalJwtGuard } from "../auth/optional-jwt.guard";
import { UserIdGuard } from "../auth/user.guard";
import { CommentsController } from "./controllers/comments.controller";
import { ReviewsController } from "./controllers/reviews.controller";

jest.mock("../../shared/utils/rich-text.utils", () => ({
  sanitizeRichText: jest.fn(),
}));

const getGuards = (handler: object) =>
  Reflect.getMetadata("__guards__", handler);

const getRoles = (handler: object) => Reflect.getMetadata(ROLES_KEY, handler);

const PUBLIC_HANDLERS: [string, object][] = [
  ["getComments", CommentsController.prototype.getComments],
  ["getReplies", CommentsController.prototype.getReplies],
  ["getReviews", ReviewsController.prototype.getReviews],
];

const USER_HANDLERS: [string, object][] = [
  ["createComment", CommentsController.prototype.createComment],
  ["updateComment", CommentsController.prototype.updateComment],
  ["deleteComment", CommentsController.prototype.deleteComment],
  ["likeComment", CommentsController.prototype.likeComment],
  ["unlikeComment", CommentsController.prototype.unlikeComment],
  ["reportComment", CommentsController.prototype.reportComment],
  ["markHelpful", ReviewsController.prototype.markHelpful],
  ["unmarkHelpful", ReviewsController.prototype.unmarkHelpful],
];

describe("Comments and reviews authorization", () => {
  it.each(PUBLIC_HANDLERS)(
    "reads %s with an optional session",
    (_name, handler) => {
      expect(getGuards(handler)).toEqual([OptionalJwtGuard]);
      expect(getRoles(handler)).toBeUndefined();
    }
  );

  it.each(USER_HANDLERS)("requires a signed-in user on %s", (_name, handler) => {
    const guards = getGuards(handler);

    expect(guards).toHaveLength(2);
    expect(guards).toContain(UserIdGuard);
    expect(getRoles(handler)).toBeUndefined();
  });

  it("requires the admin role to hide or restore a comment", () => {
    const handler = CommentsController.prototype.updateCommentStatus;

    expect(getRoles(handler)).toEqual([RolesEnum.ADMIN]);
    expect(getGuards(handler)).toHaveLength(2);
  });
});
