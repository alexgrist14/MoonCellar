import {
  AddGameRequestSchema,
  GameSchema,
  UpdateGameRequestSchema,
} from "./games.schema";

const baseGame = {
  _id: "653f1f77bcf86cd799439011",
  slug: "doom",
  name: "Doom",
  type: "main_game",
  cover: null,
  platformIds: [],
  createdAt: "2026-07-21T00:00:00.000Z",
  updatedAt: "2026-07-21T00:00:00.000Z",
};

describe("GameSchema isStopParsing", () => {
  it("accepts isStopParsing on a full game", () => {
    const result = GameSchema.safeParse({ ...baseGame, isStopParsing: true });
    expect(result.success).toBe(true);
    expect(result.success && result.data.isStopParsing).toBe(true);
  });

  it("treats isStopParsing as optional", () => {
    expect(GameSchema.safeParse(baseGame).success).toBe(true);
  });

  it("rejects a non-boolean isStopParsing", () => {
    expect(
      GameSchema.safeParse({ ...baseGame, isStopParsing: "yes" }).success
    ).toBe(false);
  });

  it("accepts isStopParsing alone on the update schema", () => {
    const result = UpdateGameRequestSchema.safeParse({ isStopParsing: true });
    expect(result.success).toBe(true);
  });

  it("accepts isStopParsing on the add schema", () => {
    const result = AddGameRequestSchema.safeParse({
      slug: "doom",
      name: "Doom",
      type: "main_game",
      cover: null,
      platformIds: [],
      isStopParsing: true,
    });
    expect(result.success).toBe(true);
  });
});
