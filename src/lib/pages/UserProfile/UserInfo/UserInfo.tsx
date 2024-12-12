import { userAPI } from "@/src/lib/shared/api";
import { IFollowings, UserGamesType } from "@/src/lib/shared/types/user.type";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import styles from "./UserInfo.module.scss";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { API_URL, FRONT_URL } from "@/src/lib/shared/constants";
import { commonUtils } from "@/src/lib/shared/utils/common";

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
                {userListCategories.map((category, i) => (
                  <Link
                    href={`${FRONT_URL}/user/${userName}?list=${category}`}
                    key={i}
                  >
                    <span>{`${commonUtils.upFL(category)}: ${
                      games[category].length
                    }`}</span>
                  </Link>
                ))}
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
                  key={`${id}_${i}`}
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
