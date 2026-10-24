import { describe, expect, it } from "bun:test";
import {
  CreateCommentRequestSchema,
  DiscussionRoomRequestSchema,
} from "./index";
import {
  getCommentTarget,
  getCommentTargetFields,
  getCommentTargetKey,
  isCommentOfTarget,
} from "./comments.utils";

const GAME_ID = "0123456789abcdef01234567";
const ARTICLE_ID = "fedcba9876543210fedcba98";

describe("CreateCommentRequestSchema", () => {
  it("takes a comment on a game or on a news post", () => {
    expect(
      CreateCommentRequestSchema.safeParse({
        gameId: GAME_ID,
        body: "<p>Hi</p>",
      }).success
    ).toBe(true);
    expect(
      CreateCommentRequestSchema.safeParse({
        articleId: ARTICLE_ID,
        parentId: GAME_ID,
        body: "<p>Hi</p>",
      }).success
    ).toBe(true);
  });

  it("refuses a comment about both, or about neither", () => {
    expect(
      CreateCommentRequestSchema.safeParse({
        gameId: GAME_ID,
        articleId: ARTICLE_ID,
        body: "<p>Hi</p>",
      }).success
    ).toBe(false);
    expect(
      CreateCommentRequestSchema.safeParse({ body: "<p>Hi</p>" }).success
    ).toBe(false);
  });

  it("lets only a game comment discuss a review", () => {
    expect(
      CreateCommentRequestSchema.safeParse({
        articleId: ARTICLE_ID,
        reviewId: GAME_ID,
        body: "<p>Hi</p>",
      }).success
    ).toBe(false);
  });
});

describe("DiscussionRoomRequestSchema", () => {
  it("follows a game or a news post", () => {
    expect(
      DiscussionRoomRequestSchema.safeParse({ gameId: GAME_ID }).data
    ).toEqual({ gameId: GAME_ID });
    expect(
      DiscussionRoomRequestSchema.safeParse({ articleId: ARTICLE_ID }).data
    ).toEqual({ articleId: ARTICLE_ID });
    expect(
      DiscussionRoomRequestSchema.safeParse({ gameId: "nope" }).success
    ).toBe(false);
  });
});

describe("comment targets", () => {
  it("maps a target to request fields and back", () => {
    const game = { type: "game", id: GAME_ID } as const;
    const article = { type: "article", id: ARTICLE_ID } as const;

    expect(getCommentTargetFields(game)).toEqual({ gameId: GAME_ID });
    expect(getCommentTargetFields(article)).toEqual({ articleId: ARTICLE_ID });
    expect(getCommentTarget({ gameId: GAME_ID, articleId: null })).toEqual(
      game
    );
    expect(getCommentTarget({ gameId: null, articleId: ARTICLE_ID })).toEqual(
      article
    );
    expect(getCommentTarget({ gameId: null, articleId: null })).toBeNull();
    expect(getCommentTargetKey(game)).not.toBe(
      getCommentTargetKey({ type: "article", id: GAME_ID })
    );
  });

  it("matches an event only to its own discussion", () => {
    const article = { type: "article", id: ARTICLE_ID } as const;

    expect(
      isCommentOfTarget({ gameId: null, articleId: ARTICLE_ID }, article)
    ).toBe(true);
    expect(
      isCommentOfTarget({ gameId: ARTICLE_ID, articleId: null }, article)
    ).toBe(false);
  });
});
