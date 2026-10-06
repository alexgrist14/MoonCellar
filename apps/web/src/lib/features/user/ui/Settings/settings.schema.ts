import z from "zod";
import { MutableNotificationTypeSchema } from "@mooncellar/schemas";

export const settingsSchema = z.object({
  userName: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(20, "Username must be less than 20 characters"),
  email: z.email("Invalid email address"),
  description: z
    .string()
    .max(450, "Description must be less than 450 characters")
    .optional(),
  showAdultContent: z.boolean().optional(),
  bgOpacity: z.number().min(0).max(100),
  mutedNotifications: MutableNotificationTypeSchema.array(),
});

export type SettingsSchema = z.infer<typeof settingsSchema>;
