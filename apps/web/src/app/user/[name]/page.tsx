import UserProfile from "@/src/lib/pages/UserProfile/UserProfile";
import { playthroughsAPI, userAPI } from "@/src/lib/shared/api";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { ACCESS_TOKEN } from "@/src/lib/shared/constants";
import { IAuthToken } from "@/src/lib/shared/types/auth.type";
import { jwtDecode } from "jwt-decode";
import { Metadata } from "next";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";
import { cookies } from "next/headers";
import { fetchOrNull } from "@/src/lib/shared/utils/not-found.utils";
import { notFound } from "next/navigation";
import { cache, Suspense } from "react";

const getUser = cache(async (name: string) =>
  fetchOrNull(userAPI.getByString(name))
);

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const user = await getUser((await params).name);

  if (!user) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

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
    alternates: {
      canonical: `/user/${user.userName}`,
    },
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

  const user = await getUser((await params).name);

  if (!user) {
    notFound();
  }
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
    <Suspense fallback={<PageLoader />}>
      <UserProfile
        user={{ ...user, followings: userFollowings, followers: userFollowers }}
        authUserId={authUserInfo?.id}
        authUserFollowings={authUserFollowings}
        playthroughs={playthroughs}
        ratings={ratings}
      />
    </Suspense>
  );
}
