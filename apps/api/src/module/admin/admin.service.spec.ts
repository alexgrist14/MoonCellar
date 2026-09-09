import { NotFoundException } from "@nestjs/common";
import { AdminService } from "./admin.service";

const createService = (findById: jest.Mock) => {
  const games = { findById };
  return new AdminService(
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    games as never
  );
};

describe("AdminService.getGameById", () => {
  it("returns the untrimmed game document", async () => {
    const game = {
      _id: "653f1f77bcf86cd799439011",
      slug: "doom",
      igdb: { gameId: 1234, genres: [5, 8], hypes: 3 },
    };
    const findById = jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(game) });

    const result = await createService(findById).getGameById(
      "653f1f77bcf86cd799439011"
    );

    expect(findById).toHaveBeenCalledWith("653f1f77bcf86cd799439011");
    expect(result.igdb.genres).toEqual([5, 8]);
    expect(result.igdb.hypes).toBe(3);
  });

  it("throws NotFoundException for a missing game", async () => {
    const findById = jest
      .fn()
      .mockReturnValue({ lean: jest.fn().mockResolvedValue(null) });

    await expect(
      createService(findById).getGameById("653f1f77bcf86cd799439011")
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
