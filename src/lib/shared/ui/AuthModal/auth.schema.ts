import z from "zod";

const userNameSchema = z
  .string()
  .min(3, "Username must be at least 3 characters")
  .max(15, "Username must be less than 15 characters")
  .regex(
    /^[a-zA-Z0-9_]+$/,
    "Username can only contain letters, numbers and underscores"
  );

export const authSchema = z.object({
  userName: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const createAuthSchema = (isRegister: boolean) =>
  isRegister
    ? authSchema.extend({
        userName: userNameSchema,
        password: z
          .string()
          .min(6, "Password must be at least 6 characters")
          .max(100, "Password must be less than 100 characters"),
      })
    : authSchema;

export type AuthSchema = z.infer<typeof authSchema>;
