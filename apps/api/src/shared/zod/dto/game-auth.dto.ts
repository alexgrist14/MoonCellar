import { createZodDto } from "nestjs-zod";
import {
  GameDeviceApproveRequestSchema,
  GameDeviceCodeRequestSchema,
  GameDeviceCodeSchema,
  GameDeviceLinkSchema,
  GameDeviceTokenRequestSchema,
  GameDeviceTokenSchema,
  GameSessionSchema,
  GameTokenIntrospectionSchema,
  GameTokenRequestSchema,
} from "@mooncellar/schemas";

export class GameDeviceCodeRequestDto extends createZodDto(
  GameDeviceCodeRequestSchema
) {}

export class GameDeviceCodeDto extends createZodDto(GameDeviceCodeSchema) {}

export class GameDeviceTokenRequestDto extends createZodDto(
  GameDeviceTokenRequestSchema
) {}

export class GameDeviceTokenDto extends createZodDto(GameDeviceTokenSchema) {}

export class GameDeviceLinkDto extends createZodDto(GameDeviceLinkSchema) {}

export class GameDeviceApproveRequestDto extends createZodDto(
  GameDeviceApproveRequestSchema
) {}

export class GameSessionDto extends createZodDto(GameSessionSchema) {}

export class GameTokenRequestDto extends createZodDto(GameTokenRequestSchema) {}

export class GameTokenIntrospectionDto extends createZodDto(
  GameTokenIntrospectionSchema
) {}
