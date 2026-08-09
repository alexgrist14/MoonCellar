import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ratingQueryKeys } from "./rating.query-keys";
import {
  IAddUserRatingRequest,
  IUpdateUserRatingRequest,
  IUserRating,
} from "@/src/lib/shared/lib/schemas/user-ratings.schema";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { useUserStore } from "@/src/lib/shared/store/user.store";

export const useCreateRatingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: IAddUserRatingRequest) =>
      ratingsAPI.add(rating).then(({ data }) => data),
    onSuccess: (rating) => {
      queryClient.setQueryData(
        ratingQueryKeys.list(rating.userId),
        (current: IUserRating[] | undefined) =>
          current ? [...current, rating] : [rating]
      );
      const { ratings, setRatings } = useUserStore.getState();
      setRatings(ratings ? [...ratings, rating] : [rating]);
    },
  });
};

export const useUpdateRatingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (rating: IUpdateUserRatingRequest) =>
      ratingsAPI.update(rating).then(({ data }) => data),
    onSuccess: (rating) => {
      queryClient.setQueryData(
        ratingQueryKeys.list(rating.userId),
        (current: IUserRating[] | undefined) =>
          current
            ? current.map((r) => (r._id === rating._id ? rating : r))
            : [rating]
      );
      const { ratings, setRatings } = useUserStore.getState();
      setRatings(
        ratings
          ? ratings.map((r) => (r._id === rating._id ? rating : r))
          : [rating]
      );
    },
  });
};

export const useDeleteRatingMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ ratingId, userId }: { ratingId: string; userId: string }) =>
      ratingsAPI.remove({ _id: ratingId, userId }).then(({ data }) => data),
    onSuccess: (rating) => {
      queryClient.setQueryData(
        ratingQueryKeys.list(rating.userId),
        (current: IUserRating[] | undefined) =>
          current ? current.filter((r) => r._id !== rating._id) : []
      );
      const { ratings, setRatings } = useUserStore.getState();
      setRatings(ratings ? ratings.filter((r) => r._id !== rating._id) : []);
    },
  });
};
