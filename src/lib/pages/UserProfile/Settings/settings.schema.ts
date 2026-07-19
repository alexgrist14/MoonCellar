import z from "zod";

export const settingsSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters")
    .optional(),
  email: z.string().email("Invalid email address").optional(),
  description: z
    .string()
    .min(1, "Description must be at least 1 characters")
    .max(450, "Description must be less than 450 characters")
    .optional(),
  raUsername: z.string().optional(),
  showAdultContent: z.boolean().optional(),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
