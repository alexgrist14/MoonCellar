import { z } from "zod";

export const UserRatingSchema = z.object({
  _id: z.string(),
  gameId: z.string(),
  userId: z.string(),
  rating: z.number().min(1).max(10).nullable(),
});

export const GetUserRatingsSchema = UserRatingSchema.pick({ userId: true });
export const AddUserRatingSchema = UserRatingSchema.omit({ _id: true });
export const UpdateUserRatingSchema = UserRatingSchema.pick({
  _id: true,
  userId: true,
  rating: true,
});
export const RemoveUserRatingSchema = UserRatingSchema.pick({
  _id: true,
  userId: true,
});

export type IUserRating = z.infer<typeof UserRatingSchema>;
export type IGetUserRatingsRequest = z.infer<typeof GetUserRatingsSchema>;
export type IAddUserRatingRequest = z.infer<typeof AddUserRatingSchema>;
export type IUpdateUserRatingRequest = z.infer<typeof UpdateUserRatingSchema>;
export type IRemoveUserRatingRequest = z.infer<typeof RemoveUserRatingSchema>;
