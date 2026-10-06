"use client";

import classNames from "classnames";
import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import {
  FAVOURITE_CHARACTERS_TAB,
  FAVOURITE_GAMES_TAB,
  ACTIVITY_TAB,
  RETROACHIEVEMENTS_TAB,
  STEAM_TAB,
  profileTabLabels,
  userListCategories,
} from "@/src/lib/shared/constants/user.const";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import { IUser } from "@/src/lib/shared/types/auth.type";
import {
  CategoriesFilterType,
  IFollowings,
} from "@/src/lib/shared/types/user.type";
import { Settings } from "@/src/lib/features/user/ui/Settings";
import { UserGames } from "@/src/lib/widgets/user/UserGames";
import { UserReviews } from "@/src/lib/widgets/user/UserReviews";
import { UserRaGames } from "@/src/lib/widgets/user/UserRaGames";
import { UserSteamGames } from "@/src/lib/widgets/user/UserSteamGames";
import { ActivityTimeline } from "@/src/lib/features/user/ui/ActivityTimeline";
import { UserLists } from "@/src/lib/widgets/user/UserLists";
import { UserInfo } from "@/src/lib/widgets/user/UserInfo";
import { FavoriteCharacters } from "@/src/lib/widgets/user/FavoriteCharacters";
import { FavoriteGames } from "@/src/lib/widgets/user/FavoriteGames";
import styles from "./UserProfile.module.scss";
import cn from "classnames";
import { Box } from "@/src/lib/shared/ui/Box";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useSelectedLayoutSegments } from "next/navigation";
import {
  UserNavigation,
  UserNavigationMenu,
} from "@/src/lib/features/user/ui/UserNavigation";
import {
  ICharacterResponse,
  ICustomList,
  IGameResponse,
  IPlaythrough,
  IUserRating,
} from "@mooncellar/schemas";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { usePlaythroughsStore } from "@/src/lib/shared/store/playthroughs.store";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";
import { useIsAuthHydrated } from "@/src/lib/shared/hooks/useIsAuthHydrated";

interface UserProfileProps {
  user: IUser;
  authUserFollowings?: IFollowings;
  authUserId?: string;
  playthroughs: IPlaythrough[];
  ratings: IUserRating[];
  favoriteGames: IGameResponse[];
  lists: ICustomList[];
  likedLists: ICustomList[];
  favoriteCharacters: ICharacterResponse[];
  children?: ReactNode;
}

export const UserProfile: FC<UserProfileProps> = ({
  user,
  authUserFollowings,
  authUserId,
  playthroughs,
  ratings,
  favoriteGames,
  lists,
  likedLists,
  favoriteCharacters,
  children,
}) => {
  const segments = useSelectedLayoutSegments().filter(
    (part) => !part.startsWith("(")
  );

  const authProfile = useAuthStore((s) => s.profile);
  const isAuthHydrated = useIsAuthHydrated();

  const viewerId =
    !isAuthHydrated || authProfile?._id === authUserId ? authUserId : undefined;

  const isAuthedUser = useMemo(() => viewerId === user._id, [viewerId, user]);

  useEffect(() => {
    if (authUserId && !viewerId) {
      refreshAuth();
    }
  }, [authUserId, viewerId]);

  const displayUser = useMemo(
    () =>
      isAuthedUser && authProfile
        ? {
            ...user,
            avatar: authProfile.avatar,
            background: authProfile.background,
            favorites: authProfile.favorites ?? user.favorites,
            favoriteCharacters:
              authProfile.favoriteCharacters ?? user.favoriteCharacters,
          }
        : user,
    [isAuthedUser, authProfile, user]
  );

  useEffect(() => {
    if (isAuthedUser) {
      userAPI.updateUserTime(user._id);
    }
  }, [isAuthedUser, user._id]);

  const setPlaythroughsStore = usePlaythroughsStore((s) => s.setPlaythroughs);

  useEffect(() => {
    if (isAuthedUser) {
      setPlaythroughsStore(playthroughs);
    }
  }, [isAuthedUser, playthroughs, setPlaythroughsStore]);

  const storePlaythroughs = usePlaythroughsStore((s) => s.playthroughs);
  const effectivePlaythroughs =
    isAuthedUser && storePlaythroughs ? storePlaythroughs : playthroughs;

  const tab = segments.join("/") || "profile";

  const isGamesTab = userListCategories.some((t) => t === tab) || tab === "all";

  const navigationProps = {
    user: displayUser,
    isAuthedUser,
    playthroughs: effectivePlaythroughs,
  };

  return (
    <>
      <BGImage userImage={displayUser.background} />
      <div className={cn(styles.container)}>
        <UserNavigationMenu {...navigationProps} />
        <Box
          classNameContent={classNames(styles.content, {
            [styles.content_auto]: tab === "settings",
          })}
        >
          {tab !== "profile" && (
            <Breadcrumbs
              className={styles.crumbs}
              items={[
                { name: "Home", href: "/" },
                {
                  name: displayUser.userName,
                  href: getProfileHref(displayUser.userName),
                },
                {
                  name: profileTabLabels[tab] ?? tab,
                  href: getProfileHref(displayUser.userName, tab),
                },
              ]}
            />
          )}
          {tab === "settings" && isAuthedUser && <Settings />}
          {tab === "profile" && (
            <UserInfo
              user={displayUser}
              authUserFollowings={viewerId ? authUserFollowings : undefined}
              authUserId={viewerId}
              isOwner={isAuthedUser}
              playthroughs={effectivePlaythroughs}
              favoriteGames={favoriteGames}
              lists={lists}
              likedLists={likedLists}
              favoriteCharacters={favoriteCharacters}
            />
          )}
          {(tab === FAVOURITE_GAMES_TAB ||
            tab === FAVOURITE_CHARACTERS_TAB) && (
            <Tabs
              ariaLabel="Favourites"
              contents={[
                {
                  tabName: "Games",
                  count: displayUser.favorites?.length ?? 0,
                  tabLink: getProfileHref(
                    displayUser.userName,
                    FAVOURITE_GAMES_TAB
                  ),
                },
                {
                  tabName: "Characters",
                  count: favoriteCharacters.length,
                  tabLink: getProfileHref(
                    displayUser.userName,
                    FAVOURITE_CHARACTERS_TAB
                  ),
                },
              ]}
              defaultTabIndex={tab === FAVOURITE_CHARACTERS_TAB ? 1 : 0}
              isUseDefaultIndex
            />
          )}
          {tab === FAVOURITE_GAMES_TAB && (
            <FavoriteGames
              userId={user._id}
              favoriteIds={displayUser.favorites ?? []}
              games={favoriteGames}
              isOwner={isAuthedUser}
            />
          )}
          {tab === FAVOURITE_CHARACTERS_TAB && (
            <FavoriteCharacters
              userId={user._id}
              characters={favoriteCharacters}
              isOwner={isAuthedUser}
            />
          )}
          {tab === "lists" && (
            <UserLists
              userId={user._id}
              userName={displayUser.userName}
              isOwnProfile={isAuthedUser}
            />
          )}
          {tab === "liked" && (
            <UserLists
              userId={user._id}
              userName={displayUser.userName}
              isOwnProfile={isAuthedUser}
              kind="liked"
            />
          )}
          {tab === ACTIVITY_TAB && (
            <ActivityTimeline userId={user._id} isOwner={isAuthedUser} />
          )}
          {tab === STEAM_TAB && <UserSteamGames steam={displayUser.steam} />}
          {tab === RETROACHIEVEMENTS_TAB && (
            <UserRaGames
              userId={user._id}
              raUsername={displayUser.raUsername}
            />
          )}
          {tab === "reviews" && (
            <UserReviews
              userId={user._id}
              userName={displayUser.userName}
              isOwnProfile={isAuthedUser}
            />
          )}
          {isGamesTab && (
            <UserGames
              list={tab as CategoriesFilterType}
              playthroughs={effectivePlaythroughs}
              ratings={ratings}
            />
          )}
          {children}
        </Box>
        <div className={styles.navigation}>
          <UserNavigation {...navigationProps} />
        </div>
      </div>
    </>
  );
};
