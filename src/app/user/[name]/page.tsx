import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { playthroughsAPI, userAPI } from "@/src/lib/shared/api";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { ACCESS_TOKEN } from "@/src/lib/shared/constants";
import { IAuthToken } from "@/src/lib/shared/types/auth.type";
import { jwtDecode } from "jwt-decode";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { fetchOrNotFound } from "@/src/lib/shared/utils/not-found.utils";

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const user = await fetchOrNotFound(userAPI.getByString((await params).name));

  return {
    title: "Profile: " + user.userName,
    description:
      user.description ||
      `${user.userName}'s game library, ratings and achievements on MoonCellar`,
    keywords: [
      user.userName,
      "game library",
      "games library",
      "game profile",
      "games profile",
      "achievements",
      "ratings",
    ],
  };
}

export default async function User({ params }: { params: any }) {
  const cookie = await cookies();
  const accessToken = cookie.get(ACCESS_TOKEN);

  const authUserInfo: IAuthToken | undefined = !!accessToken?.value
    ? jwtDecode(accessToken.value)
    : undefined;

  const authUserFollowings = !!authUserInfo
    ? (await userAPI.getUserFollowings(authUserInfo.id)).data
    : undefined;

  const user = await fetchOrNotFound(userAPI.getByString((await params).name));
  const playthroughs = (
    await playthroughsAPI.getAll({
      userId: user._id,
    })
  )?.data;
  const ratings = (
    await ratingsAPI.getAll({
      userId: user._id,
    })
  )?.data;
  const userFollowings = (await userAPI.getUserFollowings(user._id)).data;
  const userFollowers = (await userAPI.getUserFollowers(user._id)).data;

  return (
    <UserProfile
      user={{ ...user, followings: userFollowings, followers: userFollowers }}
      authUserId={authUserInfo?.id}
      authUserFollowings={authUserFollowings}
      playthroughs={playthroughs}
      ratings={ratings}
    />
  );
}
