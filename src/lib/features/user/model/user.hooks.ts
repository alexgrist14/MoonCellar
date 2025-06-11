import { gamesAPI } from "@/src/lib/shared/api/games.api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useUserStore } from "@/src/lib/shared/store/user.store";
import { useEffect } from "react";

export const useGetUserInfo = () => {
  const { profile } = useAuthStore();
  const { setPlaythroughs } = useUserStore();

  return useEffect(() => {
    !!profile?._id &&
      gamesAPI.getPlaythroughsMinimal({ userId: profile._id }).then((res) => {
        setPlaythroughs(res.data);
      });
  }, [profile, setPlaythroughs]);
};
