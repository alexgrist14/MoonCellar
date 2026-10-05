import { createZodDto } from "nestjs-zod";
import {
  LinkSteamAccountRequestSchema,
  SteamLoginUrlResponseSchema,
  SteamSyncResponseSchema,
  UnlinkSteamAccountResponseSchema,
} from "@mooncellar/schemas";

export class SteamLoginUrlResponseDto extends createZodDto(
  SteamLoginUrlResponseSchema
) {}

export class LinkSteamAccountRequestDto extends createZodDto(
  LinkSteamAccountRequestSchema
) {}

export class SteamSyncResponseDto extends createZodDto(
  SteamSyncResponseSchema
) {}

export class UnlinkSteamAccountResponseDto extends createZodDto(
  UnlinkSteamAccountResponseSchema
) {}
