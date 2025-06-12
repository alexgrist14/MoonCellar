import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { userAPI } from "@/src/lib/shared/api";
import { gamesAPI } from "@/src/lib/shared/api/games.api";
import { ACCESS_TOKEN } from "@/src/lib/shared/constants";
import { jwtDecode } from "jwt-decode";
import { cookies } from "next/headers";

export default async function User({ params }: { params: any }) {
  const cookie = await cookies();
  const accessToken = cookie.get(ACCESS_TOKEN);

  const authUserInfo: { id: string } | undefined = !!accessToken?.value
    ? jwtDecode(accessToken.value)
    : undefined;

  const authUserFollowings = !!authUserInfo
    ? (await userAPI.getUserFollowings(authUserInfo.id)).data
    : undefined;

  const user = (await userAPI.getByName((await params).name)).data;
  const playthroughs = (
    await gamesAPI.getPlaythroughsMinimal({
      userId: user._id,
    })
  )?.data;
  const userFollowings = (await userAPI.getUserFollowings(user._id)).data;
  const logsResult = (await userAPI.getUserLogs(user._id)).data;
  user.raUsername && (await userAPI.setRaUserInfo(user._id, user.raUsername));

  return (
    <UserProfile
      user={{ ...user, followings: userFollowings }}
      logs={logsResult[0]?.logs}
      authUserId={authUserInfo?.id}
      authUserFollowings={authUserFollowings}
      playthroughs={playthroughs}
    />
  );
}
