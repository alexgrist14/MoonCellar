import { z } from "zod";

export const RoleSchema = z.enum(["user", "admin", "moderator"]);
export enum RolesEnum {
  USER = "user",
  ADMIN = "admin",
  MODERATOR = "moderator",
}
export type IRole = z.infer<typeof RoleSchema>;
