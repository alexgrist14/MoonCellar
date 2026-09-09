import { SetMetadata } from "@nestjs/common";
import { type IRole } from "@mooncellar/schemas";

export const ROLES_KEY = "roles";
export const Roles = (...roles: IRole[]) => SetMetadata(ROLES_KEY, roles);
