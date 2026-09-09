import { ROLES_KEY } from "../roles/roles.decorator";
import { RolesEnum } from "src/shared/zod/schemas/role.schema";
import { GamesController } from "./controllers/games.controller";

const MUTATING_HANDLERS = [
  "addGame",
  "updateGame",
  "deleteGame",
  "uploadImage",
] as const;

const PUBLIC_HANDLERS = ["getGames", "getGameById", "getGameBySlug"] as const;

describe("GamesController authorization", () => {
  it.each(MUTATING_HANDLERS)("requires the admin role on %s", (handler) => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      GamesController.prototype[handler]
    );

    expect(roles).toEqual([RolesEnum.ADMIN]);
  });

  it.each(MUTATING_HANDLERS)("registers guards on %s", (handler) => {
    const guards = Reflect.getMetadata(
      "__guards__",
      GamesController.prototype[handler]
    );

    expect(guards).toHaveLength(2);
  });

  it.each(PUBLIC_HANDLERS)("leaves %s public", (handler) => {
    const roles = Reflect.getMetadata(
      ROLES_KEY,
      GamesController.prototype[handler]
    );

    expect(roles).toBeUndefined();
  });
});
