import { z } from "zod";

export const GameDeviceCodeRequestSchema = z.object({
  deviceName: z.string().trim().min(1).max(64),
});
export type IGameDeviceCodeRequest = z.infer<
  typeof GameDeviceCodeRequestSchema
>;

export const GameDeviceCodeSchema = z.object({
  deviceCode: z.string(),
  userCode: z.string(),
  verificationUrl: z.string(),
  verificationUrlComplete: z.string(),
  expiresIn: z.number().int().positive(),
  interval: z.number().int().positive(),
});
export type IGameDeviceCode = z.infer<typeof GameDeviceCodeSchema>;

export const GameDeviceTokenRequestSchema = z.object({
  deviceCode: z.string().min(1),
});
export type IGameDeviceTokenRequest = z.infer<
  typeof GameDeviceTokenRequestSchema
>;

export const GameAccountSchema = z.object({
  id: z.string(),
  userName: z.string(),
  avatar: z.string().nullable(),
});
export type IGameAccount = z.infer<typeof GameAccountSchema>;

export const GameDeviceTokenSchema = z.object({
  status: z.enum(["pending", "approved"]),
  token: z.string().optional(),
  account: GameAccountSchema.optional(),
});
export type IGameDeviceToken = z.infer<typeof GameDeviceTokenSchema>;

export const GameDeviceLinkSchema = z.object({
  userCode: z.string(),
  deviceName: z.string(),
  expiresAt: z.string(),
  approved: z.boolean(),
});
export type IGameDeviceLink = z.infer<typeof GameDeviceLinkSchema>;

export const GameDeviceApproveRequestSchema = z.object({
  userCode: z.string().trim().min(1).max(16),
});
export type IGameDeviceApproveRequest = z.infer<
  typeof GameDeviceApproveRequestSchema
>;

export const GameSessionSchema = z.object({
  id: z.string(),
  deviceName: z.string(),
  createdAt: z.string(),
  lastUsedAt: z.string(),
});
export type IGameSession = z.infer<typeof GameSessionSchema>;

export const GameTokenRequestSchema = z.object({
  token: z.string().min(1),
});
export type IGameTokenRequest = z.infer<typeof GameTokenRequestSchema>;

export const GameTokenIntrospectionSchema = z.object({
  active: z.boolean(),
  sessionId: z.string().optional(),
  account: GameAccountSchema.optional(),
});
export type IGameTokenIntrospection = z.infer<
  typeof GameTokenIntrospectionSchema
>;
