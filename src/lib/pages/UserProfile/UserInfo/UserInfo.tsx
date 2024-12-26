import { userAPI } from "@/src/lib/shared/api";
import {
  IFollowings,
  ILogs,
  UserGamesType,
} from "@/src/lib/shared/types/user.type";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import Image from "next/image";
import Link from "next/link";
import { Dispatch, FC, SetStateAction, useEffect, useState } from "react";
import styles from "./UserInfo.module.scss";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { API_URL, FRONT_URL, getImageLink } from "@/src/lib/shared/constants";
import { commonUtils } from "@/src/lib/shared/utils/common";


interface UserInfoProps {
  userName: string;
  _id: string;
  games: UserGamesType;
  avatar?: string;
  logs: ILogs[];
}

const UserInfo: FC<UserInfoProps> = ({
  games,
  userName,
  _id: id,
  avatar,
  logs,
}) => {
  const [userFollowings, setUserFollowing] = useState<
    IFollowings | undefined
  >();

  console.log(commonUtils.getHumanDate("2024-12-11T13:46:52.373+00:00"));

  const setActivityType = (action:string, isAdd: boolean, rating?: number) =>{
    if(rating){
      return `${isAdd ? `Set rating to ${rating}` : `Removed rating`}`;
    } else {
      return `${isAdd ? `Added to ${action}` : `Removed from ${action}`}`;
    }
  }

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
      <div className={styles.content__bottom}>
        <div className={styles.activity}>
          <h3 className={styles.activity__title}>Activity</h3>
          <div className={styles.activity__list}>
            {logs.map((log, i) => (
              <div className={styles.item} key={i}>
                <Link href={`/games/${log.game.slug}`} className={styles.item__img} target="_blank">
                    <Image width={80} height={120} src={getImageLink(log.game.cover.url, "cover_small") } alt="cover"/>
                </Link>
                <div className={styles.item__text}>
                  <p>{log.game.name}</p>
                  <p>
                    {
                      setActivityType(log.action, log.isAdd, log?.rating)
                    }

                  </p>
                  <p className={styles.date}>
                  {
                    commonUtils.getHumanDate(log.date)
                  }
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default UserInfo;
