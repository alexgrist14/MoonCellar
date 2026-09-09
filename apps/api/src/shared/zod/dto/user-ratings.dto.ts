import { createZodDto } from "nestjs-zod";
import {
  AddUserRatingSchema,
  GetUserRatingsSchema,
  RemoveUserRatingSchema,
  UpdateUserRatingSchema,
} from "../schemas/user-ratings.schema";

export class GetUserRatingDto extends createZodDto(GetUserRatingsSchema) {}
export class AddUserRatingDto extends createZodDto(AddUserRatingSchema) {}
export class UpdateUserRatingDto extends createZodDto(UpdateUserRatingSchema) {}
export class RemoveUserRatingDto extends createZodDto(RemoveUserRatingSchema) {}
