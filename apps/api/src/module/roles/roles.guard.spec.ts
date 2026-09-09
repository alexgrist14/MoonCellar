import { ExecutionContext } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RolesGuard } from "./roles.guard";
import { RolesEnum } from "src/shared/zod/schemas/role.schema";

function ctx(roles?: string[]): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({
      getRequest: () => ({ user: roles ? { roles } : undefined }),
    }),
  } as unknown as ExecutionContext;
}

function reflectorWith(requiredRoles: string[] | undefined): Reflector {
  return {
    getAllAndOverride: () => requiredRoles,
  } as unknown as Reflector;
}

describe("RolesGuard", () => {
  it("rejects an authenticated user without the required admin role", () => {
    const guard = new RolesGuard(reflectorWith([RolesEnum.ADMIN]));

    expect(guard.canActivate(ctx([RolesEnum.USER]))).toBe(false);
  });

  it("allows an authenticated user with the required admin role", () => {
    const guard = new RolesGuard(reflectorWith([RolesEnum.ADMIN]));

    expect(guard.canActivate(ctx([RolesEnum.ADMIN]))).toBe(true);
  });

  it("allows any request when the handler has no roles metadata", () => {
    const guard = new RolesGuard(reflectorWith(undefined));

    expect(guard.canActivate(ctx([RolesEnum.USER]))).toBe(true);
  });
});
