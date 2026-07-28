"use client";

import { FC, useEffect, useState } from "react";
import Link from "next/link";
import { Box } from "@/src/lib/shared/ui/Box";
import { Scrollbar } from "@/src/lib/shared/ui/Scrollbar";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { gamesApi } from "@/src/lib/shared/api";
import {
  IGameFollowingsStatusItem,
  IGetGameFollowingsStatusResponse,
} from "@/src/lib/shared/lib/schemas/game-followings-status.schema";
import { commonUtils } from "@/src/lib/shared/utils/common.utils";
import styles from "./GameFriendsStatus.module.scss";

interface IGameFriendsStatusProps {
  gameId: string;
}

const formatStatus = (item: IGameFollowingsStatusItem) => {
  const label = commonUtils.upFL(item.category);
  const countPart = item.count > 1 ? ` ×${item.count}` : "";
  const ratingPart = item.rating != null ? ` – ${item.rating}` : "";
  return `${label}${countPart}${ratingPart}`;
};

export const GameFriendsStatus: FC<IGameFriendsStatusProps> = ({ gameId }) => {
  const profile = useAuthStore((s) => s.profile);
  const [items, setItems] = useState<IGetGameFollowingsStatusResponse | null>(
    null
  );

  useEffect(() => {
    if (!profile?._id) {
      setItems(null);
      return;
    }

    let cancelled = false;
    setItems(null);

    gamesApi
      .getFollowingsStatus(gameId, profile._id)
      .then((res) => {
        if (!cancelled) setItems(res.data);
      })
      .catch(() => {
        if (!cancelled) setItems(null);
      });

    return () => {
      cancelled = true;
    };
  }, [gameId, profile?._id]);

  if (!profile?._id || !items?.length) return null;

  const list = (
    <div className={styles.block__list}>
      {items.map((item) => (
        <div key={item.userId} className={styles.block__row}>
          <Link href={`/user/${item.userName}`} className={styles.block__user}>
            <div className={styles.block__avatar}>
              <Avatar
                user={{
                  _id: item.userId,
                  userName: item.userName,
                  avatar: item.avatar,
                }}
                isWithoutTooltip
              />
            </div>
            <span className={styles.block__name}>{item.userName}</span>
          </Link>
          <span className={styles.block__status}>{formatStatus(item)}</span>
        </div>
      ))}
    </div>
  );

  return (
    <Box contentStyle={{ padding: "var(--padding-x3)" }}>
      <div className={styles.block}>
        <h4 className={styles.block__title}>Among Followings</h4>
        {items.length > 8 ? (
          <Scrollbar
            classNameContent={styles.block__scroll}
            contentStyle={{ maxHeight: "calc(var(--padding-x1) * 50)" }}
          >
            {list}
          </Scrollbar>
        ) : (
          list
        )}
      </div>
    </Box>
  );
};
