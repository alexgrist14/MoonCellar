import { useEffect } from "react";
import { usePlaythroughsMinimalQuery } from "@/src/lib/entities/playthrough/api/playthrough.queries";
import { useRatingsQuery } from "@/src/lib/entities/rating/api/rating.queries";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useUserStore } from "@/src/lib/shared/store/user.store";

export const useGetUserInfo = () => {
  const { profile } = useAuthStore();
  const { setPlaythroughs, setRatings } = useUserStore();

  const { data: playthroughs } = usePlaythroughsMinimalQuery(
    profile?._id ?? ""
  );
  const { data: ratings } = useRatingsQuery(profile?._id ?? "");

  useEffect(() => {
    if (playthroughs) {
      setPlaythroughs(playthroughs);
    }
  }, [playthroughs, setPlaythroughs]);

  useEffect(() => {
    if (ratings) {
      setRatings(ratings);
    }
  }, [ratings, setRatings]);
};
