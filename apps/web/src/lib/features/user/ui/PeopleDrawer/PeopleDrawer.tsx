import { FC, useMemo, useState } from "react";
import Link from "next/link";
import { Avatar } from "@/src/lib/shared/ui/Avatar";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { Input } from "@/src/lib/shared/ui/Input";
import { drawer } from "@/src/lib/shared/ui/Drawer";
import { IUser } from "@/src/lib/shared/types/auth.type";
import { IFollowings } from "@/src/lib/shared/types/user.type";
import { useViewerFollowings } from "@/src/lib/features/user/model/useViewerFollowings";
import styles from "./PeopleDrawer.module.scss";
import { Tabs } from "@/src/lib/shared/ui/Tabs";

export type IPeopleTab = "followers" | "followings";

type IPerson = Pick<IUser, "_id" | "userName" | "avatar">;

interface IPeopleDrawerProps {
  followers: IPerson[];
  followings: IPerson[];
  initialTab: IPeopleTab;
  viewerId?: string;
  viewerFollowings?: IFollowings;
}

export const PeopleDrawer: FC<IPeopleDrawerProps> = ({
  followers,
  followings,
  initialTab,
  viewerId,
  viewerFollowings,
}) => {
  const [tab, setTab] = useState<IPeopleTab>(initialTab);
  const [filter, setFilter] = useState("");
  const { followingIds, toggleFollowing, isBusy } = useViewerFollowings(
    viewerId,
    viewerFollowings
  );

  const people = tab === "followers" ? followers : followings;
  const needle = filter.trim().toLowerCase();

  const visible = useMemo(
    () =>
      needle
        ? people.filter((person) =>
            person.userName.toLowerCase().includes(needle)
          )
        : people,
    [people, needle]
  );

  const tabs: { key: IPeopleTab; label: string; count: number }[] = [
    { key: "followers", label: "Followers", count: followers.length },
    { key: "followings", label: "Following", count: followings.length },
  ];

  return (
    <div className={styles.people}>
      <Tabs
        contents={tabs.map((tab) => ({
          tabName: tab.label,
          onTabClick: () => setTab(tab.key),
        }))}
      />
      <Input
        placeholder="Search by name"
        value={filter}
        onChange={(event) => setFilter(event.target.value)}
        containerStyles={{ width: "100%" }}
      />
      {!visible.length && (
        <p className={styles.empty}>
          {needle
            ? `Nobody named “${filter.trim()}”.`
            : tab === "followers"
              ? "No followers yet."
              : "Not following anyone yet."}
        </p>
      )}
      <ul className={styles.list}>
        {visible.map((person) => {
          const isFollowing = followingIds.has(person._id);

          return (
            <li key={person._id}>
              <Link
                href={`/user/${person.userName}`}
                className={styles.person}
                onClick={() => drawer.close()}
              >
                <Avatar user={person} isWithoutTooltip isWithoutHover />
                <p className={styles.name}>{person.userName}</p>
                {!!viewerId && viewerId !== person._id && (
                  <Button
                    color={
                      isFollowing ? ButtonColor.DEFAULT : ButtonColor.ACCENT
                    }
                    className={styles.follow}
                    disabled={isBusy}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFollowing(person._id);
                    }}
                  >
                    {isFollowing ? "Following" : "Follow"}
                  </Button>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
