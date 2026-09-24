import { createZodDto } from "nestjs-zod";
import {
  GetUserByIdSchema,
  GetUserByStringSchema,
  GetUserLoginsResponseSchema,
  SearchUsersRequestSchema,
  SearchUsersResponseSchema,
  UpdateFavoritesRequestSchema,
  UpdateFavoritesResponseSchema,
  UpdateFavoriteCharactersRequestSchema,
  UpdateFavoriteCharactersResponseSchema,
  GetFavoriteCharactersResponseSchema,
  UpdateDescriptionSchema,
  UpdateSettingsSchema,
  UpdateUserEmailSchema,
  UpdateUserPasswordSchema,
} from "@mooncellar/schemas";

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
export class UpdateFavoritesDto extends createZodDto(
  UpdateFavoritesRequestSchema
) {}
export class UpdateFavoritesResponseDto extends createZodDto(
  UpdateFavoritesResponseSchema
) {}
export class UpdateFavoriteCharactersDto extends createZodDto(
  UpdateFavoriteCharactersRequestSchema
) {}
export class UpdateFavoriteCharactersResponseDto extends createZodDto(
  UpdateFavoriteCharactersResponseSchema
) {}
export class GetFavoriteCharactersResponseDto extends createZodDto(
  GetFavoriteCharactersResponseSchema
) {}
export class SearchUsersDto extends createZodDto(SearchUsersRequestSchema) {}
export class SearchUsersResponseDto extends createZodDto(
  SearchUsersResponseSchema
) {}
