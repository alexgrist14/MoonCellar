"use client";

import { FC, ReactNode, useEffect, useMemo, useState } from "react";
import {
  profileTabLabels,
  userListCategories,
} from "@/src/lib/shared/constants/user.const";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import { ReviewSortType, SortType } from "@/src/lib/shared/types/sort.type";
import { IUser } from "@/src/lib/shared/types/auth.type";
import {
  CategoriesFilterType,
  IFollowings,
} from "@/src/lib/shared/types/user.type";
import { Settings } from "@/src/lib/features/user/ui/Settings";
import { UserGames } from "@/src/lib/widgets/user/UserGames";
import { UserReviews } from "@/src/lib/widgets/user/UserReviews";
import { UserLists } from "@/src/lib/widgets/user/UserLists";
import { UserInfo } from "@/src/lib/widgets/user/UserInfo";
import { FavoriteCharacters } from "@/src/lib/widgets/user/FavoriteCharacters";
import styles from "./UserProfile.module.scss";
import cn from "classnames";
import { Box } from "@/src/lib/shared/ui/Box";
import { BGImage } from "@/src/lib/shared/ui/BGImage";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { ExpandMenu } from "@/src/lib/shared/ui/ExpandMenu";
import { SvgBurger } from "@/src/lib/shared/ui/svg";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { useSelectedLayoutSegment } from "next/navigation";
import { UserNavigation } from "@/src/lib/features/user/ui/UserNavigation";
import {
  ICharacterResponse,
  ICustomList,
  IGameResponse,
  IPlaythrough,
  IUserRating,
  IUserReviewsOrder,
} from "@mooncellar/schemas";
import { userAPI } from "@/src/lib/shared/api";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { usePlaythroughsStore } from "@/src/lib/shared/store/playthroughs.store";
import { refreshAuth } from "@/src/lib/shared/hooks/useAuthRefresh";

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
  const segment = useSelectedLayoutSegment();
  const { isMobile } = useStatesStore();

  const authProfile = useAuthStore((s) => s.profile);

  const viewerId =
    typeof window === "undefined" || authProfile?._id === authUserId
      ? authUserId
      : undefined;

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

  const tab = segment ?? "profile";

  const isGamesTab = userListCategories.some((t) => t === tab) || tab === "all";

  const [selectedSort, setSelectedSort] = useState<SortType>(
    SortType.DATE_ADDED
  );
  const [sortOrder, setSortOrder] = useState("desc");
  const [reviewSort, setReviewSort] = useState<ReviewSortType>(
    ReviewSortType.DATE
  );
  const [reviewOrder, setReviewOrder] = useState<IUserReviewsOrder>("desc");

  const navigationProps = {
    user: displayUser,
    isAuthedUser,
    playthroughs: effectivePlaythroughs,
    selectedSort,
    sortOrder,
    onSortChange: setSelectedSort,
    onSortOrderChange: setSortOrder,
    reviewSort,
    reviewOrder,
    onReviewSortChange: setReviewSort,
    onReviewOrderChange: (value: string) =>
      setReviewOrder(value as IUserReviewsOrder),
  };

  return (
    <>
      <BGImage userImage={displayUser.background} />
      <div className={cn(styles.container)}>
        {isMobile && (
          <ExpandMenu
            position="right"
            titleClose={
              <span className={styles.button__title}>
                <SvgBurger
                  size="32"
                  topId={cn(styles.top, styles.top_active)}
                  middleId={cn(styles.middle, styles.middle_active)}
                  bottomId={cn(styles.bottom, styles.bottom_active)}
                />
                Close
              </span>
            }
            titleOpen={
              <span className={styles.button__title}>
                <SvgBurger
                  size="32"
                  topId={cn(styles.top)}
                  middleId={cn(styles.middle)}
                  bottomId={cn(styles.bottom)}
                />
                Menu
              </span>
            }
            titleStyle={{ width: "fit-content" }}
          >
            <UserNavigation {...navigationProps} />
          </ExpandMenu>
        )}
        <Box classNameContent={styles.content}>
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
          {tab === "characters" && (
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
          {tab === "reviews" && (
            <UserReviews
              userId={user._id}
              userName={displayUser.userName}
              isOwnProfile={isAuthedUser}
              sort={reviewSort}
              order={reviewOrder}
            />
          )}
          {isGamesTab && (
            <UserGames
              list={tab as CategoriesFilterType}
              playthroughs={effectivePlaythroughs}
              ratings={ratings}
              selectedSort={selectedSort}
              sortOrder={sortOrder}
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
