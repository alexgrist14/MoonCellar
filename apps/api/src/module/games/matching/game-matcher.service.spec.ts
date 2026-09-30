import { ConflictException } from "@nestjs/common";
import { Types } from "mongoose";
import { POSSIBLE_DUPLICATES_MESSAGE } from "@mooncellar/schemas";
import { GameMatcherService } from "./game-matcher.service";

const lean = (value: unknown) => ({ lean: () => Promise.resolve(value) });

const stored = {
  _id: new Types.ObjectId(),
  slug: "hollow-knight",
  name: "Hollow Knight",
  nameNormalized: "hollow knight",
  type: "Main Game",
  genres: [],
  first_release: Date.UTC(2017, 1, 24) / 1000,
  release_dates: [],
  alternative_names: [],
  companies: [],
  platformIds: [],
  summary: "",
  isCustom: false,
};

const createService = (games: unknown[]) =>
  new GameMatcherService(
    { find: jest.fn(() => lean(games)) } as never,
    { find: jest.fn(() => lean([])) } as never
  );

describe("GameMatcherService.assertNoDuplicates", () => {
  it("answers 409 with the likely duplicates when a game with the same title exists", async () => {
    const check = createService([stored]).assertNoDuplicates({
      name: "Hollow Knight",
      first_release: Date.UTC(2017, 1, 24) / 1000,
    });

    await expect(check).rejects.toBeInstanceOf(ConflictException);
    await expect(check).rejects.toMatchObject({
      response: {
        message: POSSIBLE_DUPLICATES_MESSAGE,
        duplicates: [
          expect.objectContaining({
            slug: "hollow-knight",
            name: "Hollow Knight",
          }),
        ],
      },
    });
  });

  it("lets a game through when nothing in the catalogue resembles it", async () => {
    await expect(
      createService([]).assertNoDuplicates({ name: "Silksong" })
    ).resolves.toBeUndefined();
  });
});
