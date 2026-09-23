import { FC, useMemo } from "react";
import Image from "next/image";
import Markdown from "react-markdown";
import { ICustomList, IGameResponse, IPlaythrough } from "@mooncellar/schemas";
import { useGamesByIdsQuery } from "@/src/lib/entities/game/api/game.queries";
import {
  useLikedListsQuery,
  useUserListsQuery,
} from "@/src/lib/entities/list/api";
import { getProfileHref } from "@/src/lib/shared/utils/links.utils";
import { useAdvancedRouter } from "@/src/lib/shared/hooks/useAdvancedRouter";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useExpandStore } from "@/src/lib/shared/store/expand.store";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { IFollowings } from "@/src/lib/shared/types/user.type";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { Breadcrumbs } from "@/src/lib/shared/ui/Breadcrumbs";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { DRAWER_TRIGGER_ATTRIBUTE, drawer } from "@/src/lib/shared/ui/Drawer";
import { ListCard } from "@/src/lib/shared/ui/ListCard";
import { ListCardsGrid } from "@/src/lib/shared/ui/ListCardsGrid";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { SvgListBullet } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { ActivityTimeline } from "@/src/lib/features/user/ui/ActivityTimeline";
import { IPeopleTab, PeopleDrawer } from "@/src/lib/features/user/ui/PeopleDrawer";
import { TopTen } from "@/src/lib/widgets/user/TopTen";
import { useViewerFollowings } from "@/src/lib/features/user/model/useViewerFollowings";
import styles from "./UserInfo.module.scss";

interface UserInfoProps {
  user: IUser;
  authUserFollowings?: IFollowings;
  authUserId?: string;
  isOwner: boolean;
  playthroughs: IPlaythrough[];
  favoriteGames: IGameResponse[];
  lists: ICustomList[];
  likedLists: ICustomList[];
}

type IPerson = Pick<IUser, "_id" | "userName" | "avatar">;

const LISTS_PREVIEW_LIMIT = 6;
const STACK_LIMIT = 3;

const formatCount = new Intl.NumberFormat("en-US").format;

const PeopleStack: FC<{ people: IPerson[] }> = ({ people }) =>
  people.length ? (
    <span className={styles.stack} aria-hidden="true">
      {people.slice(0, STACK_LIMIT).map((person) => (
        <span key={person._id} className={styles.stack__item}>
          <Avatar user={person} isWithoutTooltip isWithoutHover />
        </span>
      ))}
    </span>
  ) : null;

export const UserInfo: FC<UserInfoProps> = ({
  user,
  authUserFollowings,
  authUserId,
  isOwner,
  playthroughs,
  favoriteGames,
  lists: initialLists,
  likedLists: initialLikedLists,
}) => {
  const { _id: id, userName } = user;
  const { router } = useAdvancedRouter();
  const { setExpanded } = useExpandStore();
  const viewerProfile = useAuthStore((s) => s.profile);

  const { followingIds, toggleFollowing, isBusy } = useViewerFollowings(
    authUserId,
    authUserFollowings
  );

  const isFollow = followingIds.has(id);
  const canFollow = !!authUserId && authUserId !== id;

  const baseFollowers = useMemo(
    () => user.followers?.followers ?? [],
    [user.followers]
  );
  const followings = useMemo(
    () => user.followings?.followings ?? [],
    [user.followings]
  );

  const followers = useMemo(() => {
    if (!authUserId || authUserId === id) return baseFollowers;

    const withoutViewer = baseFollowers.filter(
      (person) => person._id !== authUserId
    );
    const viewer =
      baseFollowers.find((person) => person._id === authUserId) ??
      (viewerProfile?._id === authUserId
        ? {
            _id: viewerProfile._id,
            userName: viewerProfile.userName,
            avatar: viewerProfile.avatar,
          }
        : undefined);

    return isFollow && viewer ? [viewer, ...withoutViewer] : withoutViewer;
  }, [authUserId, baseFollowers, id, isFollow, viewerProfile]);

  const favoriteIds = useMemo(() => user.favorites ?? [], [user.favorites]);
  const isServerOrder =
    favoriteIds.length === favoriteGames.length &&
    favoriteIds.every((gameId, index) => favoriteGames[index]?._id === gameId);

  const { data: liveFavorites } = useGamesByIdsQuery(
    favoriteIds,
    undefined,
    isOwner && !isServerOrder
  );

  const topGames = useMemo(() => {
    if (isServerOrder || !isOwner) return favoriteGames;

    const pool = [...(liveFavorites ?? []), ...favoriteGames];

    return favoriteIds.flatMap((gameId) => {
      const game = pool.find((item) => item._id === gameId);

      return game ? [game] : [];
    });
  }, [favoriteGames, favoriteIds, isOwner, isServerOrder, liveFavorites]);

  const { data: liveLists } = useUserListsQuery(id);
  const lists = liveLists ?? initialLists;
  const { data: liveLikedLists } = useLikedListsQuery(id);
  const likedLists = liveLikedLists ?? initialLikedLists;

  const gamesCount = useMemo(
    () => new Set(playthroughs.map((play) => play.gameId)).size,
    [playthroughs]
  );
  const reviewsCount = useMemo(
    () =>
      playthroughs.filter(
        (play) => !!play.comment && play.category !== "wishlist"
      ).length,
    [playthroughs]
  );

  const isListsVisible = isOwner || !!lists.length;

  const openPeople = (initialTab: IPeopleTab) =>
    drawer.open(
      <PeopleDrawer
        followers={followers}
        followings={followings}
        initialTab={initialTab}
        viewerId={authUserId}
        viewerFollowings={authUserFollowings}
      />,
      { title: userName }
    );

  const goTo = (list: string) => {
    setExpanded([]);
    router.push(getProfileHref(userName, list));
  };

  const triggerProps = { [DRAWER_TRIGGER_ATTRIBUTE]: "" };

  return (
    <div className={styles.profile}>
      <header className={styles.hero}>
        <div className={styles.hero__banner}>
          {!!user.background && (
            <Image
              src={user.background}
              alt=""
              fill
              priority
              sizes="100vw"
              className={styles.hero__image}
            />
          )}
          <div className={styles.hero__scrim} />
          <Breadcrumbs
            className={styles.hero__crumbs}
            items={[
              { name: "Home", href: "/" },
              { name: userName, href: `/user/${userName}` },
            ]}
          />
        </div>
        <div className={styles.hero__head}>
          <div className={styles.hero__avatar}>
            <Image
              key={id}
              src={user.avatar || "/images/user.png"}
              width={224}
              height={224}
              alt={userName}
              priority
              className={styles.hero__avatarImage}
            />
          </div>
          <div className={styles.hero__main}>
            <h1 className={styles.hero__name}>{userName}</h1>
            <p className={styles.hero__seen}>
              Last seen <span>{commonUtils.getHumanDate(user.updatedAt)}</span>
            </p>
          </div>
          {canFollow && (
            <Button
              color={isFollow ? ButtonColor.DEFAULT : ButtonColor.ACCENT}
              className={styles.hero__follow}
              disabled={isBusy}
              onClick={() => toggleFollowing(id)}
            >
              {isFollow ? "Unfollow" : "Follow"}
            </Button>
          )}
        </div>
        {!!user.description && (
          <div className={styles.bio}>
            <Markdown>{user.description}</Markdown>
          </div>
        )}
      </header>

      <div className={styles.counters}>
        <button
          type="button"
          className={styles.counter}
          onClick={() => goTo("all")}
        >
          <span className={styles.counter__label}>Games</span>
          <span className={styles.counter__value}>
            {formatCount(gamesCount)}
          </span>
        </button>
        <button
          type="button"
          className={styles.counter}
          onClick={() => goTo("reviews")}
        >
          <span className={styles.counter__label}>Reviews</span>
          <span className={styles.counter__value}>
            {formatCount(reviewsCount)}
          </span>
        </button>
        <button
          type="button"
          className={styles.counter}
          onClick={() => openPeople("followers")}
          {...triggerProps}
        >
          <span className={styles.counter__label}>Followers</span>
          <span className={styles.counter__value}>
            {formatCount(followers.length)}
            <PeopleStack people={followers} />
          </span>
        </button>
        <button
          type="button"
          className={styles.counter}
          onClick={() => openPeople("followings")}
          {...triggerProps}
        >
          <span className={styles.counter__label}>Following</span>
          <span className={styles.counter__value}>
            {formatCount(followings.length)}
            <PeopleStack people={followings} />
          </span>
        </button>
      </div>

      <TopTen userId={id} games={topGames} isOwner={isOwner} />

      {isListsVisible && (
        <section className={styles.lists} aria-labelledby="profile-lists">
          <div className={styles.lists__head}>
            <SectionTitle as="h3">
              <span id="profile-lists">Lists</span>
            </SectionTitle>
            {!!lists.length && (
              <Button
                color={ButtonColor.TRANSPARENT}
                onClick={() => goTo("lists")}
              >
                All lists
              </Button>
            )}
          </div>
          {!lists.length ? (
            <div className={styles.hint}>
              <SvgListBullet
                size="24"
                style={{ color: "var(--color-accent)" }}
              />
              <p>
                No lists yet. Collect games around any idea — “Best maps in
                games”, “Co-op with friends”.
              </p>
              <Button
                color={ButtonColor.ACCENT}
                className={styles.hint__action}
                onClick={() => goTo("lists")}
              >
                Create a list
              </Button>
            </div>
          ) : (
            <ListCardsGrid>
              {lists.slice(0, LISTS_PREVIEW_LIMIT).map((list) => (
                <ListCard key={list._id} list={list} isWithAuthor={false} />
              ))}
            </ListCardsGrid>
          )}
        </section>
      )}
      {!!likedLists.length && (
        <section className={styles.lists} aria-labelledby="profile-liked-lists">
          <div className={styles.lists__head}>
            <SectionTitle as="h3">
              <span id="profile-liked-lists">Liked lists</span>
            </SectionTitle>
            <Button
              color={ButtonColor.TRANSPARENT}
              onClick={() => goTo("liked")}
            >
              All liked
            </Button>
          </div>
          <ListCardsGrid>
            {likedLists.slice(0, LISTS_PREVIEW_LIMIT).map((list) => (
              <ListCard key={list._id} list={list} />
            ))}
          </ListCardsGrid>
        </section>
      )}
      <ActivityTimeline userId={id} isOwner={isOwner} />
    </div>
  );
};
