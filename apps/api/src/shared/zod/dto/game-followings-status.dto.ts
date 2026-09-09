import { createZodDto } from "nestjs-zod";
import {
  GetGameFollowingsStatusRequestSchema,
  GetGameFollowingsStatusResponseSchema,
} from "../schemas/game-followings-status.schema";

export class GetGameFollowingsStatusRequestDto extends createZodDto(
  GetGameFollowingsStatusRequestSchema
) {}

export class GetGameFollowingsStatusResponseDto extends createZodDto(
  GetGameFollowingsStatusResponseSchema
) {}
