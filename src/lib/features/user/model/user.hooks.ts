import { playthroughsAPI } from "@/src/lib/shared/api";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { useEffectOnce } from "@/src/lib/shared/hooks/useEffectOnce";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useUserStore } from "@/src/lib/shared/store/user.store";

export const useGetUserInfo = () => {
  const { profile } = useAuthStore();
  const { setPlaythroughs, setRatings } = useUserStore();

  return useEffectOnce(async () => {
    if (!profile?._id) return;

    return Promise.all([
      playthroughsAPI.getAllMinimal({ userId: profile._id }).then((res) => {
        setPlaythroughs(res.data);
      }),
      ratingsAPI.getAll({ userId: profile._id }).then((res) => {
        setRatings(res.data);
      }),
    ]);
  }, !!profile?._id);
};
