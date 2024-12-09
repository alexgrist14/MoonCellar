import { userAPI } from "@/src/lib/shared/api";
import { IFollowings, UserGamesType } from "@/src/lib/shared/types/user.type";
import { SvgBan, SvgDone, SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import Image from "next/image";
import Link from "next/link";
import {
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useRef,
  useState,
} from "react";
import styles from "./UserInfo.module.scss";
import { API_URL } from "@/src/lib/shared/constants";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useRouter } from "next/router";
import { Tooltip } from "@/src/lib/shared/ui/Tooltip";

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
  const [userFollowings, setUserFollowing] = useState<
    IFollowings | undefined
  >();
  const followingsRef = useRef(null);
  useEffect(() => {
    setUserFollowing(undefined);

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
          <div className={styles.friends__list} ref={followingsRef}>
            {!!userFollowings &&
              userFollowings.followings.map((item, i) => (
                <Link
                  href={`/user/${item.userName}`}
                  className={styles.friends__item}
                  key={`${id}_${i}`}
                >
                  <Avatar user={item} />
                  <Tooltip positionRef={followingsRef}>
                    {item.userName}
                  </Tooltip>
                </Link>
              ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserInfo;
