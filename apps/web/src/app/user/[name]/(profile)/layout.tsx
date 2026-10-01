import { UserProfile } from "@/src/lib/pages/UserProfile";
import {
  gamesApi,
  listsAPI,
  playthroughsAPI,
  userAPI,
} from "@/src/lib/shared/api";
import { getProfileUser } from "./profile.data";
import { ratingsAPI } from "@/src/lib/shared/api/ratings.api";
import { ACCESS_TOKEN } from "@/src/lib/shared/constants";
import { IAuthToken } from "@/src/lib/shared/types/auth.type";
import { jwtDecode } from "jwt-decode";
import { Metadata } from "next";
import { PageLoader } from "@/src/lib/shared/ui/PageLoader";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { ReactNode, Suspense } from "react";
import {
  ICharacterResponse,
  ICustomList,
  IGameResponse,
} from "@mooncellar/schemas";

const getFavoriteGames = async (ids?: string[]): Promise<IGameResponse[]> => {
  if (!ids?.length) return [];

  const games = await gamesApi
    .getByIds({ _ids: ids })
    .then(({ data }) => data)
    .catch(() => [] as IGameResponse[]);

  return ids.flatMap((id) => games.filter((game) => game._id === id));
};

const getPublicLists = (userId: string): Promise<ICustomList[]> =>
  listsAPI
    .getUserLists(userId)
    .then(({ data }) => data)
    .catch(() => []);

const getLikedLists = (userId: string): Promise<ICustomList[]> =>
  listsAPI
    .getLikedLists(userId)
    .then(({ data }) => data)
    .catch(() => []);

const getFavoriteCharacters = (userId: string): Promise<ICharacterResponse[]> =>
  userAPI
    .getFavoriteCharacters(userId)
    .then(({ data }) => data)
    .catch(() => []);

export async function generateMetadata({
  params,
}: {
  params: any;
}): Promise<Metadata> {
  const user = await getProfileUser((await params).name).catch(
    (error: unknown) => {
      console.error("Failed to load profile metadata:", error);

      return undefined;
    }
  );

  if (user === undefined) {
    return { title: "Profile" };
  }

  if (!user) {
    return {
      title: "Page not found",
      robots: { index: false, follow: false },
    };
  }

  return {
    title: {
      default: "Profile: " + user.userName,
      template: "%s | MoonCellar",
    },
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

export default async function ProfileLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: any;
}) {
  const cookie = await cookies();
  const accessToken = cookie.get(ACCESS_TOKEN);

  const authUserInfo: IAuthToken | undefined = !!accessToken?.value
    ? jwtDecode(accessToken.value)
    : undefined;

  const [authUserFollowings, user] = await Promise.all([
    authUserInfo
      ? userAPI.getUserFollowings(authUserInfo.id).then(({ data }) => data)
      : undefined,
    getProfileUser((await params).name),
  ]);

  if (!user) {
    notFound();
  }

  const [
    playthroughs,
    ratings,
    userFollowings,
    userFollowers,
    favoriteGames,
    lists,
    likedLists,
    favoriteCharacters,
  ] = await Promise.all([
    playthroughsAPI.getAll({ userId: user._id }).then(({ data }) => data),
    ratingsAPI.getAll({ userId: user._id }).then(({ data }) => data),
    userAPI.getUserFollowings(user._id).then(({ data }) => data),
    userAPI.getUserFollowers(user._id).then(({ data }) => data),
    getFavoriteGames(user.favorites),
    getPublicLists(user._id),
    getLikedLists(user._id),
    getFavoriteCharacters(user._id),
  ]);

  return (
    <Suspense fallback={<PageLoader />}>
      <UserProfile
        user={{ ...user, followings: userFollowings, followers: userFollowers }}
        authUserId={authUserInfo?.id}
        authUserFollowings={authUserFollowings}
        playthroughs={playthroughs}
        ratings={ratings}
        favoriteGames={favoriteGames}
        lists={lists}
        likedLists={likedLists}
        favoriteCharacters={favoriteCharacters}
      >
        {children}
      </UserProfile>
    </Suspense>
  );
}
