import { gamesApi, userAPI } from "@/src/lib/shared/api";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { IFollowings, ILogs } from "@/src/lib/shared/types/user.type";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { Button } from "@/src/lib/shared/ui/Button";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import Image from "next/image";
import Link from "next/link";
import { FC, useEffect, useMemo, useState } from "react";
import styles from "./UserInfo.module.scss";
import Markdown from "react-markdown";
import { Interweave } from "interweave";
import { useAsyncLoader } from "@/src/lib/shared/hooks/useAsyncLoader";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { Cover } from "@/src/lib/shared/ui/Cover";
import { IGameResponse } from "@/src/lib/shared/lib/schemas/games.schema";

interface UserInfoProps {
  user: IUser;
  authUserFollowings?: IFollowings;
  authUserId?: string;
}

const UserInfo: FC<UserInfoProps> = ({
  user,
  authUserFollowings,
  authUserId,
}) => {
  const { sync, isLoading } = useAsyncLoader();
  const { _id: id, followings: userFollowings, userName } = user;

  const [logs, setLogs] = useState<(ILogs & { game?: IGameResponse })[]>([]);
  const [userAuthFollowings, setUserAuthFollowings] = useState<IFollowings>(
    authUserFollowings || { followings: [] }
  );

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

  useEffect(() => {
    sync(async () => {
      const logsRes = await userAPI.getUserLogs(user._id);

      const _ids = logsRes.data.map((log) => log.gameId);

      const gamesRes = await gamesApi.getByIds({ _ids });

      return setLogs(
        logsRes.data.map((log) => ({
          ...log,
          game: gamesRes.data.find((game) => log.gameId === game._id),
        }))
      );
    });
  }, [user, sync]);

  return (
    <>
      <div className={styles.content__top}>
        <div className={styles.profile}>
          <div className={styles.profile__left}>
            <div className={styles.profile__image}>
              <Image
                key={id}
                src={user.avatar || "/images/user.png"}
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
                <span>Last seen:</span>{" "}
                {commonUtils.getHumanDate(user.updatedAt)}
              </div>
              {user.description && (
                <div className={styles.profile__description}>
                  <Markdown>{user.description}</Markdown>
                </div>
              )}
            </div>
          </div>
          <div className={styles.friends}>
            <h3 className={styles.title}>Friends</h3>
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
      </div>
      <div className={styles.content__bottom}>
        <div className={styles.activity}>
          <h3 className={styles.title}>Activity</h3>
          {isLoading && <Loader type="moon" />}
          {!isLoading && logs?.length > 0 && (
            <div className={styles.activity__list}>
              {logs.map((log, i) => {
                if (!log.game) return null;

                return (
                  <div className={styles.item} key={i}>
                    <Link
                      href={`/games/${log.game?.slug}`}
                      className={styles.item__img}
                      target="_blank"
                    >
                      {!!log.game?.cover ? (
                        <Image
                          width={70}
                          height={110}
                          src={log.game.cover}
                          style={{ width: "80px", height: "120px" }}
                          alt="cover"
                        />
                      ) : (
                        <Cover
                          isWithoutText
                          style={{ width: "80px", height: "120px" }}
                        />
                      )}
                    </Link>
                    <div className={styles.item__text}>
                      <p>{log.game.name}</p>
                      <Interweave content={log.text} />
                      <p className={styles.date}>
                        {commonUtils.getHumanDate(log.date)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserInfo;
