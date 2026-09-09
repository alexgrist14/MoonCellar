import { createZodDto } from "nestjs-zod";
import {
  GetUserByIdSchema,
  GetUserByStringSchema,
  GetUserLoginsResponseSchema,
  UpdateDescriptionSchema,
  UpdateSettingsSchema,
  UpdateUserEmailSchema,
  UpdateUserPasswordSchema,
} from "../schemas/user.schema";

export class GetUserByStringDto extends createZodDto(GetUserByStringSchema) {}
export class GetUserByIdDto extends createZodDto(GetUserByIdSchema) {}
export class UpdateUserEmailDto extends createZodDto(UpdateUserEmailSchema) {}
export class UpdateUserPasswordDto extends createZodDto(
  UpdateUserPasswordSchema
) {}
export class UpdateDescriptionDto extends createZodDto(
  UpdateDescriptionSchema
) {}
export class UpdateSettingsDto extends createZodDto(UpdateSettingsSchema) {}
export class GetUserLoginsResponseDto extends createZodDto(
  GetUserLoginsResponseSchema
) {}
