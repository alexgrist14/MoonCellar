"use client";

import { FC, useEffect, useMemo, useState } from "react";
import { userListCategories } from "../../shared/constants/user.const";
import { ReviewSortType, SortType } from "../../shared/types/sort.type";
import { IUser } from "../../shared/types/auth.type";
import { IFollowings } from "../../shared/types/user.type";
import { Settings } from "./Settings";
import { UserGames } from "./UserGames";
import { UserReviews } from "./UserReviews";
import { UserLists } from "./UserLists";
import UserInfo from "./UserInfo/UserInfo";
import styles from "./UserProfile.module.scss";
import cn from "classnames";
import { Box } from "../../shared/ui/Box";
import { BGImage } from "../../shared/ui/BGImage";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { SvgBurger } from "../../shared/ui/svg";
import { useStatesStore } from "../../shared/store/states.store";
import { useSearchParams } from "next/navigation";
import { UserNavigation } from "../../features/user/ui/UserNavigation";
import {
  ICustomList,
  IGameResponse,
  IPlaythrough,
  IUserRating,
  IUserReviewsOrder,
} from "@mooncellar/schemas";
import { userAPI } from "../../shared/api";
import { useAuthStore } from "../../shared/store/auth.store";
import { usePlaythroughsStore } from "../../shared/store/playthroughs.store";
import { refreshAuth } from "../../shared/hooks/useAuthRefresh";

interface UserProfileProps {
  user: IUser;
  authUserFollowings?: IFollowings;
  authUserId?: string;
  playthroughs: IPlaythrough[];
  ratings: IUserRating[];
  favoriteGames: IGameResponse[];
  lists: ICustomList[];
  likedLists: ICustomList[];
}

const UserProfile: FC<UserProfileProps> = ({
  user,
  authUserFollowings,
  authUserId,
  playthroughs,
  ratings,
  favoriteGames,
  lists,
  likedLists,
}) => {
  const query = useSearchParams();
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

  const tab = useMemo(
    () => (!!query?.get("list") ? (query.get("list") as string) : "profile"),
    [query]
  );

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
            position="bottom-right"
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
                  href: `/user/${displayUser.userName}`,
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
              playthroughs={effectivePlaythroughs}
              ratings={ratings}
              selectedSort={selectedSort}
              sortOrder={sortOrder}
            />
          )}
        </Box>
        <div className={styles.navigation}>
          <UserNavigation {...navigationProps} />
        </div>
      </div>
    </>
  );
};

export default UserProfile;
