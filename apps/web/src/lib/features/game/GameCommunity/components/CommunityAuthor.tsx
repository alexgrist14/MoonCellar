import { FC } from "react";
import Link from "next/link";
import classNames from "classnames";
import { ICommunityAuthor } from "@mooncellar/schemas";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import styles from "../GameCommunity.module.scss";

interface ICommunityAuthorProps {
  author: ICommunityAuthor | null;
  isSmall?: boolean;
}

export const CommunityAvatar: FC<ICommunityAuthorProps> = ({
  author,
  isSmall,
}) => (
  <span
    className={classNames(styles.avatar, { [styles.avatar_small]: isSmall })}
  >
    {author ? (
      <Link href={`/user/${author.userName}`} aria-label={author.userName}>
        <Avatar
          user={{ ...author, avatar: author.avatar ?? "" }}
          isWithoutTooltip
        />
      </Link>
    ) : (
      <Avatar isWithoutTooltip isWithoutHover />
    )}
  </span>
);

export const AuthorName: FC<Pick<ICommunityAuthorProps, "author">> = ({
  author,
}) =>
  author ? (
    <Link href={`/user/${author.userName}`} className={styles.entry__name}>
      {author.userName}
    </Link>
  ) : (
    <span className={styles.entry__name}>Deleted user</span>
  );
