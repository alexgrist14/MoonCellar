import { FC, useMemo } from "react";
import {
  FAVOURITE_CHARACTERS_TAB,
  ACTIVITY_TAB,
  RETROACHIEVEMENTS_TAB,
  STEAM_TAB,
  FAVOURITE_GAMES_TAB,
} from "@/src/lib/shared/constants/user.const";
import Image from "next/image";
import Markdown from "react-markdown";
import {
  ICharacterResponse,
  ICustomList,
  IGameResponse,
  IPlaythrough,
} from "@mooncellar/schemas";
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
import { EmptyState } from "@/src/lib/shared/ui/EmptyState";
import { ListCard } from "@/src/lib/shared/ui/ListCard";
import { ListCardsGrid } from "@/src/lib/shared/ui/ListCardsGrid";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { StatTile } from "@/src/lib/shared/ui/StatTile";
import { SvgListBullet } from "@/src/lib/shared/ui/svg";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import { ActivityTimeline } from "@/src/lib/features/user/ui/ActivityTimeline";
import {
  IPeopleTab,
  PeopleDrawer,
} from "@/src/lib/features/user/ui/PeopleDrawer";
import { FavoriteGames } from "@/src/lib/widgets/user/FavoriteGames";
import { FavoriteCharacters } from "@/src/lib/widgets/user/FavoriteCharacters";
import { UserRaGames } from "@/src/lib/widgets/user/UserRaGames";
import { UserSteamGames } from "@/src/lib/widgets/user/UserSteamGames";
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
  favoriteCharacters: ICharacterResponse[];
}

type IPerson = Pick<IUser, "_id" | "userName" | "avatar">;

const LISTS_PREVIEW_LIMIT = 12;
const PREVIEW_ROWS = 2;
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
  favoriteCharacters,
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

  const hiddenBlocks = new Set(user.settings?.hiddenProfileBlocks ?? []);
  const isListsVisible =
    !hiddenBlocks.has("lists") && (isOwner || !!lists.length);

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

      {!hiddenBlocks.has("counters") && (
        <div className={styles.counters}>
          <StatTile
            label="Games"
            value={formatCount(gamesCount)}
            onClick={() => goTo("all")}
          />
          <StatTile
            label="Reviews"
            value={formatCount(reviewsCount)}
            onClick={() => goTo("reviews")}
          />
          <StatTile
            label="Followers"
            value={formatCount(followers.length)}
            onClick={() => openPeople("followers")}
            {...triggerProps}
          >
            <PeopleStack people={followers} />
          </StatTile>
          <StatTile
            label="Following"
            value={formatCount(followings.length)}
            onClick={() => openPeople("followings")}
            {...triggerProps}
          >
            <PeopleStack people={followings} />
          </StatTile>
        </div>
      )}

      {!hiddenBlocks.has("favoriteGames") && (
        <FavoriteGames
          userId={id}
          favoriteIds={user.favorites ?? []}
          games={favoriteGames}
          isOwner={isOwner}
          isPreview
          onShowAll={() => goTo(FAVOURITE_GAMES_TAB)}
        />
      )}

      {!hiddenBlocks.has("favoriteCharacters") && (
        <FavoriteCharacters
          userId={id}
          characters={favoriteCharacters}
          isOwner={isOwner}
          isPreview
          onShowAll={() => goTo(FAVOURITE_CHARACTERS_TAB)}
        />
      )}

      {!hiddenBlocks.has("retroachievements") && (
        <UserRaGames
          userId={id}
          raUsername={user.raUsername}
          isPreview
          onShowAll={() => goTo(RETROACHIEVEMENTS_TAB)}
        />
      )}

      {!hiddenBlocks.has("steam") && (
        <UserSteamGames
          steam={user.steam}
          isPreview
          onShowAll={() => goTo(STEAM_TAB)}
        />
      )}

      {isListsVisible && (
        <section className={styles.lists} aria-labelledby="profile-lists">
          <SectionTitle
            as="h3"
            count={lists.length || undefined}
            action={
              !!lists.length && (
                <Button
                  color={ButtonColor.TRANSPARENT}
                  onClick={() => goTo("lists")}
                  aria-label="All lists"
                >
                  All
                </Button>
              )
            }
          >
            <span id="profile-lists">Lists</span>
          </SectionTitle>
          {!lists.length ? (
            <EmptyState
              variant="inline"
              icon={
                <SvgListBullet
                  size="24"
                  style={{ color: "var(--color-accent)" }}
                />
              }
              title="No lists yet. Collect games around any idea — “Best maps in games”, “Co-op with friends”."
              action={
                <Button
                  color={ButtonColor.ACCENT}
                  onClick={() => goTo("lists")}
                >
                  Create a list
                </Button>
              }
            />
          ) : (
            <ListCardsGrid maxRows={PREVIEW_ROWS} isGameSized>
              {lists.slice(0, LISTS_PREVIEW_LIMIT).map((list) => (
                <ListCard key={list._id} list={list} isWithAuthor={false} />
              ))}
            </ListCardsGrid>
          )}
        </section>
      )}
      {!hiddenBlocks.has("likedLists") && !!likedLists.length && (
        <section className={styles.lists} aria-labelledby="profile-liked-lists">
          <SectionTitle
            as="h3"
            count={likedLists.length}
            action={
              <Button
                color={ButtonColor.TRANSPARENT}
                onClick={() => goTo("liked")}
                aria-label="All liked lists"
              >
                All
              </Button>
            }
          >
            <span id="profile-liked-lists">Liked lists</span>
          </SectionTitle>
          <ListCardsGrid maxRows={PREVIEW_ROWS} isGameSized>
            {likedLists.slice(0, LISTS_PREVIEW_LIMIT).map((list) => (
              <ListCard key={list._id} list={list} />
            ))}
          </ListCardsGrid>
        </section>
      )}
      {!hiddenBlocks.has("activity") && (
        <ActivityTimeline
          userId={id}
          isOwner={isOwner}
          isPreview
          onShowAll={() => goTo(ACTIVITY_TAB)}
        />
      )}
    </div>
  );
};
