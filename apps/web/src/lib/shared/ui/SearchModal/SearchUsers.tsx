import { FC, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ISearchUserResult } from "@mooncellar/schemas";
import {
  useAddUserFollowingMutation,
  useRemoveUserFollowingMutation,
} from "@/src/lib/entities/user/api/user.mutations";
import { useAuthStore } from "../../store/auth.store";
import { commonUtils } from "../../utils/common.utils";
import Avatar from "../Avatar/Avatar";
import { Button, ButtonColor } from "../Button";
import { Highlight } from "../Highlight";
import styles from "./SearchModal.module.scss";

const pluralize = (count: number, word: string) =>
  `${count} ${count === 1 ? word : `${word}s`}`;

interface ISearchUserRowProps {
  user: ISearchUserResult;
  query: string;
  onNavigate: () => void;
}

const SearchUserRow: FC<ISearchUserRowProps> = ({
  user,
  query,
  onNavigate,
}) => {
  const viewer = useAuthStore((s) => s.profile);
  const [isFollowed, setIsFollowed] = useState(user.isFollowedByViewer);

  const { mutate: addFollowing, isPending: isAdding } =
    useAddUserFollowingMutation();
  const { mutate: removeFollowing, isPending: isRemoving } =
    useRemoveUserFollowingMutation();

  const isSelf = viewer?._id === user._id;
  const href = `/user/${user.userName}`;

  const toggleFollow = () => {
    if (!viewer?._id) return;

    const next = !isFollowed;
    const mutate = next ? addFollowing : removeFollowing;

    setIsFollowed(next);
    mutate(
      { userId: viewer._id, followingId: user._id },
      { onError: () => setIsFollowed(!next) }
    );
  };

  return (
    <div className={styles.user}>
      <Link href={href} className={styles.user__link} onClick={onNavigate}>
        <div className={styles.user__avatar}>
          <Avatar
            user={{
              _id: user._id,
              userName: user.userName,
              avatar: user.avatar ?? "",
            }}
            isWithoutTooltip
            isWithoutHover
          />
        </div>
        <span className={styles.user__body}>
          <span className={styles.user__name}>
            <Highlight text={user.userName} query={query} />
          </span>
          <span className={styles.user__meta}>
            <span>Last seen {commonUtils.getHumanDate(user.updatedAt)}</span>
            <span>
              {pluralize(user.gamesCount, "game")} ·{" "}
              {pluralize(user.followersCount, "follower")}
            </span>
            {user.followsViewer && !isSelf && (
              <span className={styles.user__follows}>Follows you</span>
            )}
          </span>
        </span>
      </Link>
      <div className={styles.user__side}>
        {!!user.favoriteCovers.length && (
          <Link
            href={href}
            className={styles.user__favorites}
            aria-label={`Favourite games of ${user.userName}`}
            onClick={onNavigate}
          >
            {user.favoriteCovers.slice(0, 5).map((cover) => (
              <span key={cover} className={styles.user__cover}>
                <Image src={cover} alt="" fill sizes="24px" />
              </span>
            ))}
          </Link>
        )}
        {!!viewer?._id && !isSelf && (
          <Button
            compact
            color={isFollowed ? ButtonColor.DEFAULT : ButtonColor.ACCENT}
            className={styles.user__follow}
            disabled={isAdding || isRemoving}
            onClick={toggleFollow}
          >
            {isFollowed ? "Following" : "Follow"}
          </Button>
        )}
      </div>
    </div>
  );
};

interface ISearchUsersProps {
  users: ISearchUserResult[];
  query: string;
  hasMore: boolean;
  isFetchingMore: boolean;
  onMore: () => void;
  onNavigate: () => void;
}

export const SearchUsers: FC<ISearchUsersProps> = ({
  users,
  query,
  hasMore,
  isFetchingMore,
  onMore,
  onNavigate,
}) => (
  <div className={styles.users}>
    {users.map((user) => (
      <SearchUserRow
        key={user._id}
        user={user}
        query={query}
        onNavigate={onNavigate}
      />
    ))}
    {hasMore && (
      <Button
        className={styles.modal__wide}
        disabled={isFetchingMore}
        onClick={onMore}
      >
        Show 10 more users
      </Button>
    )}
  </div>
);
