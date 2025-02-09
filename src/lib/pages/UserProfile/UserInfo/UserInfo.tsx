import { userAPI } from "@/src/lib/shared/api";
import { getImageLink } from "@/src/lib/shared/constants";
import { IUser } from "@/src/lib/shared/types/auth";
import { IFollowings, ILogs } from "@/src/lib/shared/types/user.type";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { Button } from "@/src/lib/shared/ui/Button";
import { commonUtils } from "@/src/lib/shared/utils/common";
import Image from "next/image";
import Link from "next/link";
import { FC, useMemo, useState } from "react";
import styles from "./UserInfo.module.scss";
import Markdown from "react-markdown";

interface UserInfoProps {
  user: IUser;
  logs: ILogs[];
  authUserFollowings: IFollowings;
  authUserId: string;
}

const UserInfo: FC<UserInfoProps> = ({
  user,
  authUserFollowings,
  authUserId,
  logs,
}) => {
  const { _id: id, followings: userFollowings, userName, games } = user;

  const [userAuthFollowings, setUserAuthFollowings] =
    useState<IFollowings>(authUserFollowings);

  const RA_STATIC_URL = "https://media.retroachievements.org";

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

  const isFollow = useMemo(() => {
    return userAuthFollowings?.followings
      .map((follow) => follow._id)
      .includes(id);
  }, [id, userAuthFollowings?.followings]);

  const handleFollowClick = () => {
    if (!authUserId) return;
    isFollow
      ? userAPI
          .removeUserFollowing(authUserId, id)
          .then((res) => setUserAuthFollowings(res.data))
      : userAPI
          .addUserFollowing(authUserId, id)
          .then((res) => setUserAuthFollowings(res.data));
  };

  return (
    <>
      <div className={styles.content__top}>
        <div className={styles.profile}>
          <div className={styles.profile__image}>
            <Image
              key={id}
              src={commonUtils.getAvatar(user) || "/images/user.png"}
              width={160}
              height={160}
              alt="profile"
              className={styles.image}
            />
            {id !== authUserId && (
              <Button className={styles.btn} onClick={handleFollowClick}>
                {isFollow ? "Unfollow" : "Follow"}
              </Button>
            )}
          </div>

          <div className={styles.profile__info}>
            <div className={styles.profile__name}>{userName}</div>
            <div className={styles.date}>
              <span>Last seen:</span> {commonUtils.getHumanDate(user.updatedAt)}
            </div>
            {user.description && (
              <Markdown className={styles.profile__description}>
                {user.description}
              </Markdown>
            )}
            {/* <div className={styles.profile__stats}>
              <div className={styles.profile__stats__list}>
                {userListCategories.map((category, i) => (
                  <Link
                    href={`${FRONT_URL}/user/${userName}?list=${category}`}
                    key={i}
                  >
                    <span>{`${commonUtils.upFL(category)}: ${
                      games[`${category}`].length
                    }`}</span>
                  </Link>
                ))}
              </div>
            </div> */}
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
        <div className={styles.ra}>
          <h3 className={styles.ra__title}>Mastered RA games</h3>
          <div className={styles.ra__list}>
            {user.raAwards?.map((item) => {
              if (item.awardType === "Mastery/Completion")
                return (
                  <div className={styles.ra__item} key={item.awardedAt}>
                    <Image
                      src={`${RA_STATIC_URL}${item.imageIcon}`}
                      width={52}
                      height={52}
                      alt={"ra"}
                    ></Image>
                  </div>
                );
            })}
          </div>
        </div>
        <div className={styles.ra}>
          <h3 className={styles.ra__title}>Beaten RA games</h3>
          <div className={styles.ra__list}>
            {user.raAwards?.map((item) => {
              if (item.awardType === "Game Beaten")
                return (
                  <div className={styles.ra__item_beaten} key={item.awardedAt}>
                    <Image
                      src={`${RA_STATIC_URL}${item.imageIcon}`}
                      width={52}
                      height={52}
                      alt={"ra"}
                    ></Image>
                  </div>
                );
            })}
          </div>
        </div>
        {logs?.length > 0 && (
          <div className={styles.activity}>
            <h3 className={styles.activity__title}>Activity</h3>
            <div className={styles.activity__list}>
              {logs.map((log, i) => (
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
