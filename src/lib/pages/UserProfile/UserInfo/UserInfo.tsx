import { useUserLogsQuery } from "@/src/lib/entities/user/api/user.queries";
import {
  useAddUserFollowingMutation,
  useRemoveUserFollowingMutation,
  useRemoveUserLogMutation,
} from "@/src/lib/entities/user/api/user.mutations";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { IFollowings } from "@/src/lib/shared/types/user.type";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { Button } from "@/src/lib/shared/ui/Button";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import Image from "next/image";
import Link from "next/link";
import { FC, useMemo, useState } from "react";
import styles from "./UserInfo.module.scss";
import Markdown from "react-markdown";
import { Interweave } from "interweave";
import { Loader } from "@/src/lib/shared/ui/Loader";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { Box } from "@/src/lib/shared/ui/Box";
import { SectionTitle } from "@/src/lib/shared/ui/SectionTitle";
import { Pagination } from "@/src/lib/shared/ui/Pagination";
import { takeLogs } from "@/src/lib/shared/constants/user.const";
import { SvgClose } from "@/src/lib/shared/ui/svg";
import { modal } from "@/src/lib/shared/ui/Modal";
import { ConfirmModal } from "@/src/lib/shared/ui/ConfirmModal/ConfirmModal";
import { toast } from "@/src/lib/shared/utils/toast.utils";

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
  const {
    _id: id,
    followings: userFollowings,
    followers: userFollowers,
    userName,
  } = user;

  const [page, setPage] = useState(1);

  const [userAuthFollowings, setUserAuthFollowings] = useState<IFollowings>(
    authUserFollowings || { followings: [] }
  );

  const { data: logsData, isPending, isFetching } = useUserLogsQuery(
    user._id,
    page,
    takeLogs
  );

  const logs = logsData?.results ?? [];
  const totalLogs = logsData?.total ?? 0;

  const { mutate: addFollowing } = useAddUserFollowingMutation();
  const { mutate: removeFollowing } = useRemoveUserFollowingMutation();
  const { mutate: removeLog } = useRemoveUserLogMutation();

  const isFollow = useMemo(() => {
    return userAuthFollowings?.followings
      .map((follow) => follow._id)
      .includes(id);
  }, [id, userAuthFollowings?.followings]);

  const handleFollowClick = () => {
    if (!authUserId) return;
    const mutate = isFollow ? removeFollowing : addFollowing;
    mutate(
      { userId: authUserId, followingId: id },
      { onSuccess: (data) => setUserAuthFollowings(data) }
    );
  };

  const handleDeleteLog = (logId: string) => {
    const modalId = `delete-log-${logId}`;

    modal.open(
      <ConfirmModal
        title="Delete Log"
        message="Are you sure you want to delete this log entry?"
        onConfirm={() =>
          removeLog(
            { userId: id, _id: logId },
            {
              onSuccess: () => {
                modal.close(modalId);
                toast.success({ description: "Log deleted successfully" });
              },
            }
          )
        }
        onCancel={() => modal.close(modalId)}
      />,
      { id: modalId }
    );
  };

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
          <div className={styles.friendsGroup}>
            <div className={styles.friends}>
              <SectionTitle as="h3">Following</SectionTitle>
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
            <div className={styles.friends}>
              <SectionTitle as="h3">Followers</SectionTitle>
              <div className={styles.friends__list}>
                {!!userFollowers &&
                  userFollowers.followers.map((item, i) => (
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
      </div>
      <div className={styles.content__bottom}>
        <div className={styles.activity}>
          <SectionTitle as="h3">Activity</SectionTitle>
          {isPending && <Loader type="moon" />}
          {!isPending && logs.length > 0 && (
            <div className={styles.activity__wrapper}>
              <div className={styles.activity__list}>
                {logs.map((log, i) => {
                  if (!log.game) return null;

                  return (
                    <div key={i} className={styles.item}>
                      <GameCard game={log.game} className={styles.item__card} />
                      <Box
                        classNameContent={styles.item__text}
                        wrapperStyle={{ marginBlock: "var(--padding-x2)" }}
                      >
                        {id === authUserId && (
                          <Button
                            className={styles.item__delete}
                            onClick={() => handleDeleteLog(log._id)}
                          >
                            <SvgClose size="16" color="negative" />
                          </Button>
                        )}
                        <p>{log.game.name}</p>
                        <Interweave content={log.text} />
                        <p className={styles.date}>
                          {commonUtils.getHumanDate(log.date)}
                        </p>
                      </Box>
                    </div>
                  );
                })}
              </div>
              <Pagination
                take={takeLogs}
                total={totalLogs}
                isDisabled={isFetching}
                page={page}
                onPageChange={setPage}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default UserInfo;
