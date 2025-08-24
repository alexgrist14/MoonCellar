import { z } from "zod";
import { RaAwardSchema } from "./ra.schema";
import { RoleSchema } from "./role.schema";

export const UserSchemaZod = z.object({
  _id: z.string(),
  userName: z
    .string()
    .min(3)
    .max(15)
    .regex(/^[a-zA-Z0-9_]+$/),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  refreshToken: z.string().jwt().nullable(),
  followings: z.array(z.string()),
  filters: z.array(z.object({ name: z.string(), filter: z.string() })),
  presets: z.array(z.object({ name: z.string(), preset: z.string() })),
  description: z.string().max(450).nullable(),
  raUsername: z.string().nullable(),
  raAwards: RaAwardSchema.array(),
  roles: RoleSchema.array().default(["user"]),
  avatar: z.string().url().nullable(),
  background: z.string().url().nullable(),
  updatedAt: z.date(),
});

export const GetUserByStringSchema = z.object({
  searchString: z.union([
    z.string().email(),
    z
      .string()
      .min(3)
      .max(15)
      .regex(/^[a-zA-Z0-9_]+$/),
  ]),
});
export const GetUserByIdSchema = UserSchemaZod.pick({ _id: true });
export const UpdateUserEmailSchema = UserSchemaZod.pick({ email: true });
export const UpdateUserPasswordSchema = z.object({
  oldPassword: z.string().min(8).max(100),
  newPassword: z.string().min(8).max(100),
});
export const UpdateDescriptionSchema = UserSchemaZod.pick({
  description: true,
});

export type IUser = z.infer<typeof UserSchemaZod>;
export type IGetUserByStringRequest = z.infer<typeof GetUserByStringSchema>;
export type IGetUserByIdRequest = z.infer<typeof GetUserByIdSchema>;
export type IUpdateUserEmailRequest = z.infer<typeof UpdateUserEmailSchema>;
export type IUpdateUserPasswordRequest = z.infer<
  typeof UpdateUserPasswordSchema
>;
export type IUpdateUserDescriptionRequest = z.infer<
  typeof UpdateDescriptionSchema
>;
