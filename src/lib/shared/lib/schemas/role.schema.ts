import { z } from "zod";

export const RoleSchema = z.enum(["user", "admin", "moderator"]);
export type IRole = z.infer<typeof RoleSchema>;
