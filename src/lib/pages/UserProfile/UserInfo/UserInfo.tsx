import { userAPI } from "@/src/lib/shared/api";
import { IFollowings, UserGamesType } from "@/src/lib/shared/types/user.type";
import { SvgBan, SvgDone, SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import styles from "./UserInfo.module.scss";
import { API_URL } from "@/src/lib/shared/constants";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useRouter } from "next/router";

interface UserInfoProps {
  userName: string;
  _id: string;
  games: UserGamesType;
  avatar?: string;
  setTabIndex: Dispatch<SetStateAction<number>>;
}

const UserInfo: FC<UserInfoProps> = ({
  games,
  userName,
  _id: id,
  avatar,
  setTabIndex,
}) => {
  const [userFollowings, setUserFollowing] = useState<IFollowings>();
  const { profile } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    userAPI
      .getUserFollowings(id)
      .then((res) => setUserFollowing(res.data))
      .catch();
  }, [id]);

  return (
    <>
      <div className={styles.content__top}>
        <div className={styles.profile_info}>
          <div className={styles.profile_image}>
            <Image
              key={id}
              src={avatar || "/images/user.png"}
              width={160}
              height={160}
              alt="profile"
              className={styles.image}
            />
          </div>
          <div>
            <div className={styles.profile_name}>{userName}</div>
            <div className={styles.profile_stats}>
              <h3 className={styles.profile_stats__title}>Games stats</h3>
              <div className={styles.profile_stats__list}>
                <Link href="completed">
                  <SvgDone className={styles.completed} />
                  <span>Completed: {games.completed.length}</span>
                </Link>
                <Link href="playing">
                  <SvgPlay className={styles.playing} />
                  <span>Playing: {games.playing.length}</span>
                </Link>
                <Link href="wishlist">
                  <SvgStar className={styles.wishlist} />
                  <span>Wishlist: {games.wishlist.length}</span>
                </Link>
                <Link href="dropped">
                  <SvgBan className={styles.dropped} />
                  <span>Dropped: {games.dropped.length}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.friends}>
          <h3 className={styles.friends__title}>Friends</h3>
          <div className={styles.friends__list}>
            {!!userFollowings &&
              userFollowings.followings.map((item, i) => (
                <Link
                  href={`/user/${item.userName}`}
                  className={styles.friends__item}
                  key={i}
                >
                  <Avatar user={item} />
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserInfo;
