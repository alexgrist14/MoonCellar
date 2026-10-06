import { FC, useMemo } from "react";
import styles from "./UserNavigation.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { IUser } from "@/src/lib/shared/types/auth.type";
import {
  FAVOURITE_CHARACTERS_TAB,
  FAVOURITE_GAMES_TAB,
  ACTIVITY_TAB,
  RETROACHIEVEMENTS_TAB,
  STEAM_TAB,
  userListCategories,
} from "@/src/lib/shared/constants/user.const";
import { useUserRaGamesQuery } from "@/src/lib/entities/user/api/user.queries";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { SvgSettings } from "@/src/lib/shared/ui/svg";
import { IPlaythrough } from "@mooncellar/schemas";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import {
  getProfileHref,
  getProfileTab,
} from "@/src/lib/shared/utils/links.utils";
import {
  useLikedListsQuery,
  useUserListsQuery,
} from "@/src/lib/entities/list/api";

export const UserNavigation: FC<{
  isAuthedUser: boolean;
  user: IUser;
  playthroughs: IPlaythrough[];
}> = ({ isAuthedUser, user, playthroughs }) => {
  const { pathname } = useAdvancedRouter();

  const { setExpanded } = useExpandStore();

  const currentList = getProfileTab(pathname, user.userName);

  const isGamesTab =
    userListCategories.some((category) => category === currentList) ||
    currentList === "all";

  const isProfileTab = pathname === getProfileHref(user.userName);
  const isReviewsTab = currentList === "reviews";
  const isListsTab = currentList === "lists";
  const isLikedTab = currentList === "liked";
  const isFavoritesTab = currentList === "favourites";
  const favoritesCount = user.favorites?.length ?? 0;
  const favoriteCharactersCount = user.favoriteCharacters?.length ?? 0;

  const { data: userLists = [] } = useUserListsQuery(user._id);
  const { data: likedLists = [] } = useLikedListsQuery(user._id);
  const { data: raGames = [] } = useUserRaGamesQuery(
    user._id,
    !!user.raUsername
  );

  const visibleLists = useMemo(
    () =>
      isAuthedUser ? userLists : userLists.filter((list) => !list.isPrivate),
    [isAuthedUser, userLists]
  );

  const closeMenu = () => setExpanded([]);

  const reviewsCount = playthroughs?.filter(
    (play) => !!play.comment && play.category !== "wishlist"
  ).length;

  const allPlays = playthroughs?.reduce((res: IPlaythrough[], play) => {
    if (!res.some((p) => p.gameId === play.gameId)) {
      res.push(play);
    }
    return res;
  }, []);

  return (
    <div className={styles.panel}>
      <Box classNameContent={styles.identity}>
        <Button
          className={styles.btn}
          active={isProfileTab}
          color={ButtonColor.TRANSPARENT}
          href={getProfileHref(user.userName, "profile")}
          onClick={closeMenu}
        >
          <div className={styles.profile}>
            <div className={styles.avatar}>
              <Avatar
                user={user}
                shape="rounded"
                isWithoutTooltip={true}
                isWithoutHover={true}
              />
            </div>
            <span className={styles.label}>{user.userName}</span>
          </div>
        </Button>
        {isAuthedUser && (
          <Button
            color={ButtonColor.TRANSPARENT}
            active={currentList === "settings"}
            href={getProfileHref(user.userName, "settings")}
            tooltip="Settings"
            isOnlyIcon
            onClick={closeMenu}
          >
            <SvgSettings size="20" />
          </Button>
        )}
      </Box>
      <Box>
        <Button
          className={styles.btn}
          active={currentList === "all"}
          color={ButtonColor.TRANSPARENT}
          href={getProfileHref(user.userName, "all")}
          onClick={closeMenu}
        >
          <span className={styles.label}>All</span>
          <span className={styles.count}>{allPlays.length}</span>
        </Button>
        {userListCategories.map((category, i) => {
          const plays = playthroughs?.reduce((res: IPlaythrough[], play) => {
            if (
              ((play.category === category && !play.isMastered) ||
                (category === "mastered" && play.isMastered)) &&
              !res.some((p) => p.gameId === play.gameId)
            ) {
              res.push(play);
            }
            return res;
          }, []);

          return (
            <Button
              key={category + i}
              className={styles.btn}
              active={currentList === category}
              color={ButtonColor.TRANSPARENT}
              href={getProfileHref(user.userName, category.toLowerCase())}
              onClick={closeMenu}
            >
              <span className={styles.label}>{commonUtils.upFL(category)}</span>
              <span className={styles.count}>{plays.length}</span>
            </Button>
          );
        })}
      </Box>
      <Box>
        <Button
          className={styles.btn}
          active={isReviewsTab}
          color={ButtonColor.TRANSPARENT}
          href={getProfileHref(user.userName, "reviews")}
          onClick={closeMenu}
        >
          <span className={styles.label}>Reviews</span>
          <span className={styles.count}>{reviewsCount}</span>
        </Button>
        {(isAuthedUser || !!favoritesCount || !!favoriteCharactersCount) && (
          <Button
            className={styles.btn}
            active={isFavoritesTab}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(
              user.userName,
              !favoritesCount && favoriteCharactersCount
                ? FAVOURITE_CHARACTERS_TAB
                : FAVOURITE_GAMES_TAB
            )}
            onClick={closeMenu}
          >
            <span className={styles.label}>Favourites</span>
            <span className={styles.count}>
              {favoritesCount + favoriteCharactersCount}
            </span>
          </Button>
        )}
        {!!user.raUsername && (
          <Button
            className={styles.btn}
            active={currentList === RETROACHIEVEMENTS_TAB}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, RETROACHIEVEMENTS_TAB)}
            onClick={closeMenu}
          >
            <span className={styles.label}>RetroAchievements</span>
            <span className={styles.count}>{raGames.length}</span>
          </Button>
        )}
        {!!user.steam?.steamId && (
          <Button
            className={styles.btn}
            active={currentList === STEAM_TAB}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, STEAM_TAB)}
            onClick={closeMenu}
          >
            <span className={styles.label}>Steam</span>
            <span className={styles.count}>
              {user.steam.achievements?.filter(({ gameId }) => !!gameId)
                .length ?? 0}
            </span>
          </Button>
        )}
        {(isAuthedUser || !!visibleLists.length) && (
          <Button
            className={styles.btn}
            active={isListsTab}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "lists")}
            onClick={closeMenu}
          >
            <span className={styles.label}>Lists</span>
            <span className={styles.count}>{visibleLists.length}</span>
          </Button>
        )}
        {!!likedLists.length && (
          <Button
            className={styles.btn}
            active={isLikedTab}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "liked")}
            onClick={closeMenu}
          >
            <span className={styles.label}>Liked lists</span>
            <span className={styles.count}>{likedLists.length}</span>
          </Button>
        )}
        <Button
          className={styles.btn}
          active={currentList === ACTIVITY_TAB}
          color={ButtonColor.TRANSPARENT}
          href={getProfileHref(user.userName, ACTIVITY_TAB)}
          onClick={closeMenu}
        >
          <span className={styles.label}>Activity</span>
        </Button>
      </Box>
    </div>
  );
};
