import { FC, useMemo, useRef, useState } from "react";
import styles from "./UserNavigation.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import classNames from "classnames";
import { SvgSettings, SvgSort } from "@/src/lib/shared/ui/svg";
import { IPlaythrough } from "@mooncellar/schemas";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { ReviewSortType, SortType } from "@/src/lib/shared/types/sort.type";
import { CustomDropdown } from "@/src/lib/shared/ui/CustomDropdown";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";
import {
  getProfileHref,
  getProfileTab,
} from "@/src/lib/shared/utils/links.utils";
import {
  useLikedListsQuery,
  useUserListsQuery,
} from "@/src/lib/entities/list/api";

const sortOptions = [
  { label: SortType.DATE_ADDED },
  { label: SortType.RATING },
  { label: SortType.PLAYTHROUGHS },
  { label: SortType.COMMENTS },
];
const reviewSortOptions = Object.values(ReviewSortType).map((label) => ({
  label,
}));
const sortOrderOptions = [{ label: "asc" }, { label: "desc" }];

export const UserNavigation: FC<{
  isAuthedUser: boolean;
  user: IUser;
  playthroughs: IPlaythrough[];
  selectedSort?: SortType;
  sortOrder?: string;
  onSortChange?: (value: SortType) => void;
  onSortOrderChange?: (value: string) => void;
  reviewSort?: ReviewSortType;
  reviewOrder?: string;
  onReviewSortChange?: (value: ReviewSortType) => void;
  onReviewOrderChange?: (value: string) => void;
}> = ({
  isAuthedUser,
  user,
  playthroughs,
  selectedSort,
  sortOrder,
  onSortChange,
  onSortOrderChange,
  reviewSort,
  reviewOrder,
  onReviewSortChange,
  onReviewOrderChange,
}) => {
  const { pathname, router } = useAdvancedRouter();

  const { setExpanded } = useExpandStore();

  const sortRef = useRef<HTMLDivElement>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useCloseEvents([sortRef], () => setIsSortOpen(false));

  const currentList = getProfileTab(pathname, user.userName);

  const isGamesTab =
    userListCategories.some((category) => category === currentList) ||
    currentList === "all";

  const isProfileTab = pathname === getProfileHref(user.userName);
  const isReviewsTab = currentList === "reviews";
  const isListsTab = currentList === "lists";
  const isLikedTab = currentList === "liked";

  const { data: userLists = [] } = useUserListsQuery(user._id);
  const { data: likedLists = [] } = useLikedListsQuery(user._id);

  const visibleLists = useMemo(
    () =>
      isAuthedUser ? userLists : userLists.filter((list) => !list.isPrivate),
    [isAuthedUser, userLists]
  );

  const goToTab = (tab: string) => {
    setExpanded([]);
    router.push(getProfileHref(user.userName, tab));
  };

  const reviewsCount = playthroughs?.filter(
    (play) => !!play.comment && play.category !== "wishlist"
  ).length;

  const allPlays = playthroughs?.reduce((res: IPlaythrough[], play) => {
    if (!res.some((p) => p.gameId === play.gameId)) {
      res.push(play);
    }
    return res;
  }, []);

  const renderSortIcon = (order: string) => (
    <SvgSort
      size="24"
      className={classNames(styles.sort__icon, {
        [styles.sort__icon_active]: order === "desc",
      })}
    />
  );

  return (
    <div className={styles.panel}>
      {!isProfileTab && (
        <Box>
          <Button
            className={styles.btn}
            color={ButtonColor.TRANSPARENT}
            onClick={() => goToTab("profile")}
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
          onClick={() => goToTab("all")}
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
              onClick={() => goToTab(category.toLowerCase())}
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
            onClick={() => goToTab("lists")}
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
            onClick={() => goToTab("liked")}
          >
            <span>Liked lists</span>
            <span>{likedLists.length}</span>
          </Button>
        )}
        <Button
          className={styles.btn}
          active={isReviewsTab}
          color={ButtonColor.TRANSPARENT}
          onClick={() => goToTab("reviews")}
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
            onClick={() => goToTab("settings")}
          >
            <div>
              <SvgSettings size="24" />
              <span>Settings</span>
            </div>
          </Button>
        </Box>
      )}
      {((isReviewsTab && !!reviewSort && !!onReviewSortChange) ||
        (isGamesTab && !!selectedSort && !!onSortChange)) && (
        <Box>
          <div className={styles.sort} ref={sortRef}>
            {isReviewsTab && !!reviewSort && !!onReviewSortChange ? (
              <CustomDropdown
                isOpen={isSortOpen}
                setIsOpen={setIsSortOpen}
                onSelect={onReviewSortChange}
                onExtendedSelect={onReviewOrderChange}
                extendedSelected={reviewOrder}
                options={reviewSortOptions}
                selected={reviewSort}
                extendedOptions={sortOrderOptions}
                headerClassName={styles.sort__header}
                className={styles.sort__dropdown}
                icon={renderSortIcon(reviewOrder ?? "desc")}
              />
            ) : (
              !!selectedSort &&
              !!onSortChange && (
                <CustomDropdown
                  isOpen={isSortOpen}
                  setIsOpen={setIsSortOpen}
                  onSelect={onSortChange}
                  onExtendedSelect={onSortOrderChange}
                  extendedSelected={sortOrder}
                  options={sortOptions}
                  selected={selectedSort}
                  extendedOptions={sortOrderOptions}
                  headerClassName={styles.sort__header}
                  className={styles.sort__dropdown}
                  icon={renderSortIcon(sortOrder ?? "desc")}
                />
              )
            )}
          </div>
        </Box>
      )}
    </div>
  );
};
