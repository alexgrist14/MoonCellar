import { createZodDto } from "nestjs-zod";
import {
  GetGameFollowingsStatusRequestSchema,
  GetGameFollowingsStatusResponseSchema,
} from "@mooncellar/schemas";

export class GetGameFollowingsStatusRequestDto extends createZodDto(
  GetGameFollowingsStatusRequestSchema
) {}

export class GetGameFollowingsStatusResponseDto extends createZodDto(
  GetGameFollowingsStatusResponseSchema
) {}
