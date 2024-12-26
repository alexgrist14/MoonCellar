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
import { Button } from "@/src/lib/shared/ui/Button";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { mergeLogs } from "@/src/lib/shared/utils/logs";

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
  const { profile } = useAuthStore();

  const mergedLogs = mergeLogs(logs);

  const [userFollowings, setUserFollowing] = useState<
    IFollowings | undefined
  >();

  const [follow, setFollow] = useState(
    profile?.followings.includes(id) ? "Unfollow" : "Follow"
  );

  const setActivityType = (action: string, isAdd: boolean, rating?: number) => {
    const actions = action.split(" and ");
    const result = actions.map((act) => {
      if (act === "rating") {
        return `${isAdd ? `set rating ${rating}` : `removed rating`}`;
      } else {
        return `${isAdd ? `added to ${act}` : `removed from ${act}`}`;
      }
    });
    return commonUtils.upFL(result.join(" and "));
  };

  useEffect(() => {
    if (profile?.followings.includes(id)) {
      setFollow("Unfollow");
    } else setFollow("Follow");
  }, [id, profile?.followings]);

  useEffect(() => {
    setUserFollowing(undefined);

    userAPI
      .getUserFollowings(id)
      .then((res) => setUserFollowing(res.data))
      .catch();
  }, [id]);

  const handleFollowClick = () => {
    if (profile?.followings.includes(id)) {
      userAPI.removeUserFollowing(profile._id, id);
      setFollow("Follow");
    } else if (profile) {
      userAPI.addUserFollowing(profile._id, id);
      setFollow("Unfollow");
    }
  };

  return (
    <>
      <div className={styles.content__top}>
        <div className={styles.profile__info}>
          <div className={styles.profile__image}>
            <Image
              key={id}
              src={avatar || "/images/user.png"}
              width={160}
              height={160}
              alt="profile"
              className={styles.image}
            />
            {id !== profile?._id && (
              <Button className={styles.btn} onClick={handleFollowClick}>
                {follow}
              </Button>
            )}
          </div>

          <div>
            <div className={styles.profile__name}>{userName}</div>
            <div className={styles.profile__stats}>
              <div className={styles.profile__stats__list}>
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
        {logs.length > 0 && (
          <div className={styles.activity}>
            <h3 className={styles.activity__title}>Activity</h3>
            <div className={styles.activity__list}>
              {mergedLogs.map((log, i) => (
                <div className={styles.item} key={i}>
                  <Link
                    href={`/games/${log.game.slug}`}
                    className={styles.item__img}
                    target="_blank"
                  >
                    <Image
                      width={70}
                      height={110}
                      src={getImageLink(log.game.cover.url, "cover_big")}
                      style={{ width: "80px", height: "120px" }}
                      alt="cover"
                    />
                  </Link>
                  <div className={styles.item__text}>
                    <p>{log.game.name}</p>
                    <p>{setActivityType(log.action, log.isAdd, log?.rating)}</p>
                    <p className={styles.date}>
                      {commonUtils.getHumanDate(log.date)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default UserInfo;
