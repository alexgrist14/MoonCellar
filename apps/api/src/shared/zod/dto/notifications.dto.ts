import { createZodDto } from "nestjs-zod";
import {
  GetNotificationsRequestSchema,
  GetNotificationsResponseSchema,
  MarkNotificationsReadRequestSchema,
  PushPublicKeyResponseSchema,
  PushSubscriptionRequestSchema,
  PushUnsubscribeRequestSchema,
  UnreadNotificationsResponseSchema,
} from "@mooncellar/schemas";

export class GetNotificationsRequestDto extends createZodDto(
  GetNotificationsRequestSchema
) {}

export class GetNotificationsResponseDto extends createZodDto(
  GetNotificationsResponseSchema
) {}

export class MarkNotificationsReadRequestDto extends createZodDto(
  MarkNotificationsReadRequestSchema
) {}

export class UnreadNotificationsResponseDto extends createZodDto(
  UnreadNotificationsResponseSchema
) {}

export class PushPublicKeyResponseDto extends createZodDto(
  PushPublicKeyResponseSchema
) {}

export class PushSubscriptionRequestDto extends createZodDto(
  PushSubscriptionRequestSchema
) {}

export class PushUnsubscribeRequestDto extends createZodDto(
  PushUnsubscribeRequestSchema
) {}
