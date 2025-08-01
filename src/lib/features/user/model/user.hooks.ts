import { gamesAPI } from "@/src/lib/shared/api/games.api";
import { useEffectOnce } from "@/src/lib/shared/hooks/useEffectOnce";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useUserStore } from "@/src/lib/shared/store/user.store";

export const useGetUserInfo = () => {
  const { profile } = useAuthStore();
  const { setPlaythroughs, setRatings } = useUserStore();

  return useEffectOnce(async () => {
    return gamesAPI
      .getPlaythroughsMinimal({ userId: profile?._id })
      .then((res) => {
        setPlaythroughs(res.data);
      });

    // userAPI.get({ userId: profile._id }).then((res) => {
    //   setPlaythroughs(res.data);
    // });
  }, !!profile?._id);
};
