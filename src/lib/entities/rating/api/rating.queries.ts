import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { ratingQueryKeys } from "./rating.query-keys";
import { useQuery } from "@tanstack/react-query";

export const useRatingsQuery = (userId: string) => {
  return useQuery({
    queryKey: ratingQueryKeys.list(userId),
    queryFn: () => ratingsAPI.getAll({ userId }).then((res) => res.data),
    enabled: !!userId,
    staleTime: 60000,
  });
};
