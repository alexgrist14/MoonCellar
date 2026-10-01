import { FC, useMemo } from "react";
import styles from "./UserNavigation.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
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
  const isFavoritesTab = currentList === "favorites";
  const favoritesCount = user.favorites?.length ?? 0;
  const isCharactersTab = currentList === "characters";
  const favoriteCharactersCount = user.favoriteCharacters?.length ?? 0;

  const { data: userLists = [] } = useUserListsQuery(user._id);
  const { data: likedLists = [] } = useLikedListsQuery(user._id);

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
      {!isProfileTab && (
        <Box>
          <Button
            className={styles.btn}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "profile")}
            onClick={closeMenu}
          >
            <div>
              <div className={styles.avatar}>
                <Avatar
                  user={user}
                  isWithoutTooltip={true}
                  isWithoutHover={true}
                />
              </div>
              <span>{user.userName}</span>
            </div>
          </Button>
        </Box>
      )}
      <Box>
        <Button
          className={styles.btn}
          active={currentList === "all"}
          color={ButtonColor.TRANSPARENT}
          href={getProfileHref(user.userName, "all")}
          onClick={closeMenu}
        >
          <span>All</span>
          <span>{allPlays.length}</span>
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
              <span>{commonUtils.upFL(category)}</span>
              <span>{plays.length}</span>
            </Button>
          );
        })}
      </Box>
      <Box>
        {(isAuthedUser || !!visibleLists.length) && (
          <Button
            className={styles.btn}
            active={isListsTab}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "lists")}
            onClick={closeMenu}
          >
            <span>Lists</span>
            <span>{visibleLists.length}</span>
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
            <span>Liked lists</span>
            <span>{likedLists.length}</span>
          </Button>
        )}
        {(isAuthedUser || !!favoritesCount) && (
          <Button
            className={styles.btn}
            active={isFavoritesTab}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "favorites")}
            onClick={closeMenu}
          >
            <span>Favourites</span>
            <span>{favoritesCount}</span>
          </Button>
        )}
        {(isAuthedUser || !!favoriteCharactersCount) && (
          <Button
            className={styles.btn}
            active={isCharactersTab}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "characters")}
            onClick={closeMenu}
          >
            <span>Characters</span>
            <span>{favoriteCharactersCount}</span>
          </Button>
        )}
        <Button
          className={styles.btn}
          active={isReviewsTab}
          color={ButtonColor.TRANSPARENT}
          href={getProfileHref(user.userName, "reviews")}
          onClick={closeMenu}
        >
          <span>Reviews</span>
          <span>{reviewsCount}</span>
        </Button>
      </Box>
      {isAuthedUser && (
        <Box>
          <Button
            className={styles.btn}
            active={currentList === "settings"}
            color={ButtonColor.TRANSPARENT}
            href={getProfileHref(user.userName, "settings")}
            onClick={closeMenu}
          >
            <div>
              <SvgSettings size="24" />
              <span>Settings</span>
            </div>
          </Button>
        </Box>
      )}
    </div>
  );
};
