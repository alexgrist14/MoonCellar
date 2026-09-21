import { FC, useMemo, useRef, useState } from "react";
import Link from "next/link";
import queryString from "query-string";
import styles from "./UserNavigation.module.scss";
import { Box } from "@/src/lib/shared/ui/Box";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import classNames from "classnames";
import {
  SvgLock,
  SvgPlus,
  SvgSettings,
  SvgSort,
} from "@/src/lib/shared/ui/svg";
import { IPlaythrough } from "@mooncellar/schemas";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { ReviewSortType, SortType } from "@/src/lib/shared/types/sort.type";
import { CustomDropdown } from "@/src/lib/shared/ui/CustomDropdown";
import useCloseEvents from "@/src/lib/shared/hooks/useCloseEvents";
import {
  useLikedListsQuery,
  useUserListsQuery,
} from "@/src/lib/entities/list/api";
import { openListModal } from "@/src/lib/features/lists/ui/ListModal";
import { getListHref } from "@/src/lib/shared/ui/ListCard";

const NAVIGATION_LISTS_LIMIT = 8;

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
  const { setQuery, query, pathname, router } = useAdvancedRouter();

  const { setExpanded } = useExpandStore();

  const sortRef = useRef<HTMLDivElement>(null);
  const [isSortOpen, setIsSortOpen] = useState(false);

  useCloseEvents([sortRef], () => setIsSortOpen(false));

  const profilePath = `/user/${user.userName}`;
  const isOnProfilePage = pathname === profilePath;
  const currentList = isOnProfilePage ? query.get("list") : null;

  const isGamesTab =
    userListCategories.some((category) => category === currentList) ||
    currentList === "all";

  const isProfileTab =
    isOnProfilePage && (!currentList || currentList === "profile");
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

  const goToTab = (value: { [key: string]: string | number }) => {
    setExpanded([]);

    if (isOnProfilePage) {
      setQuery(value);
      return;
    }

    router.push(`${profilePath}?${queryString.stringify(value)}`);
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
            className={classNames(styles.btn, styles.tall)}
            color={ButtonColor.TRANSPARENT}
            onClick={() => goToTab({ list: "profile" })}
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
          onClick={() => goToTab({ list: "all", page: 1 })}
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
              onClick={() => goToTab({ list: category.toLowerCase(), page: 1 })}
            >
              <span>{commonUtils.upFL(category)}</span>
              <span>{plays.length}</span>
            </Button>
          );
        })}
      </Box>
      {(isAuthedUser || !!visibleLists.length) && (
        <Box>
          <Button
            className={styles.btn}
            active={isListsTab}
            color={ButtonColor.TRANSPARENT}
            onClick={() => goToTab({ list: "lists" })}
          >
            <span>Lists</span>
            <span>{visibleLists.length}</span>
          </Button>
          {visibleLists.slice(0, NAVIGATION_LISTS_LIMIT).map((list) => {
            const href = getListHref({
              slug: list.slug,
              author: { _id: user._id, userName: user.userName },
            });

            return (
              <Link
                key={list._id}
                href={href}
                onClick={() => setExpanded([])}
                className={classNames(styles.list, {
                  [styles.list_active]: pathname === href,
                })}
              >
                <span className={styles.list__name}>
                  {list.name}
                  {list.isPrivate && (
                    <SvgLock
                      size="12"
                      aria-label="Private"
                      className={styles.list__lock}
                      style={{ color: "inherit" }}
                    />
                  )}
                </span>
                <span className={styles.list__count}>{list.gamesCount}</span>
              </Link>
            );
          })}
          {visibleLists.length > NAVIGATION_LISTS_LIMIT && (
            <Button
              className={classNames(styles.btn, styles.last)}
              color={ButtonColor.TRANSPARENT}
              onClick={() => goToTab({ list: "lists" })}
            >
              <span>Show all {visibleLists.length}</span>
            </Button>
          )}
          {isAuthedUser && (
            <Button
              color={ButtonColor.TRANSPARENT}
              className={classNames(styles.btn, styles.last)}
              onClick={() => openListModal({ userName: user.userName })}
            >
              <div className={styles.edit}>
                <span>New list</span>
                <SvgPlus size="16" />
              </div>
            </Button>
          )}
        </Box>
      )}
      {!!likedLists.length && (
        <Box>
          <Button
            className={styles.btn}
            active={isLikedTab}
            color={ButtonColor.TRANSPARENT}
            onClick={() => goToTab({ list: "liked" })}
          >
            <span>Liked lists</span>
            <span>{likedLists.length}</span>
          </Button>
          {likedLists.slice(0, NAVIGATION_LISTS_LIMIT).map((list) => {
            const href = getListHref(list);

            return (
              <Link
                key={list._id}
                href={href}
                onClick={() => setExpanded([])}
                className={classNames(styles.list, {
                  [styles.list_active]: pathname === href,
                })}
              >
                <span className={styles.list__name}>{list.name}</span>
                <span className={styles.list__count}>{list.gamesCount}</span>
              </Link>
            );
          })}
          {likedLists.length > NAVIGATION_LISTS_LIMIT && (
            <Button
              className={classNames(styles.btn, styles.last)}
              color={ButtonColor.TRANSPARENT}
              onClick={() => goToTab({ list: "liked" })}
            >
              <span>Show all {likedLists.length}</span>
            </Button>
          )}
        </Box>
      )}
      <Box>
        <Button
          className={styles.btn}
          active={isReviewsTab}
          color={ButtonColor.TRANSPARENT}
          onClick={() => goToTab({ list: "reviews" })}
        >
          <span>Reviews</span>
          <span>{reviewsCount}</span>
        </Button>
      </Box>
      {isAuthedUser && (
        <Box>
          <Button
            className={classNames(styles.btn, styles.tall)}
            active={currentList === "settings"}
            color={ButtonColor.TRANSPARENT}
            onClick={() => goToTab({ list: "settings" })}
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
