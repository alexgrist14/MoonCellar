import { FC, useCallback, useEffect, useMemo, useState } from "react";
import styles from "./UserProfile.module.scss";
import {
  CategoriesCount,
  IFollowings,
  IGamesRating,
  ILogs,
  UserGamesType,
} from "../../shared/types/user.type";
import { Tabs } from "../../shared/ui/Tabs";
import { ITabContent } from "../../shared/types/tabs";
import UserInfo from "./UserInfo/UserInfo";
import { Settings } from "./Settings";
import { API_URL } from "../../shared/constants";
import { userListCategories } from "../../shared/constants/user.const";
import { GameCard } from "../../shared/ui/GameCard";
import { commonUtils } from "../../shared/utils/common";
import { useRouter } from "next/router";
import { Scrollbar } from "../../shared/ui/Scrollbar";
import { UserGames } from "./UserGames";
import queryString from "query-string";
import classNames from "classnames";
import Image from "next/image";
import Background from "../../shared/ui/Background/Background";
import { IUser } from "../../shared/types/auth";
import { useAuthStore } from "../../shared/store/auth.store";
import { IGDBGameMinimal } from "../../shared/types/igdb";
import { userAPI } from "../../shared/api";
import { axiosUtils } from "../../shared/utils/axios";

interface UserProfileProps {
  user: IUser;
  userGamesLength: CategoriesCount;
  logs: ILogs[];
  authUserFollowings: IFollowings;
  authUserId: string;
}

const UserProfile: FC<UserProfileProps> = ({ user, logs, userGamesLength, authUserFollowings, authUserId }) => {
  const { query, push, pathname } = useRouter();

  const { profile } = useAuthStore();

  const [avatar, setAvatar] = useState<string | undefined>("");
  const [isImageReady, setIsImageReady] = useState(false);

  const tab = query.list as string;

  const pushTab = useCallback(
    (tab: string, page?: number) => {
      push(
        {
          pathname,
          query: queryString.stringify({
            ...query,
            list: tab,
            page: page || query.page,
          }),
        },
        undefined,
        { shallow: true }
      );
    },
    [pathname, push, query]
  );

  useEffect(() => {
    !query.list && pushTab("profile");
  }, [pushTab, query.list]);

  const tabs = useMemo((): ITabContent[] => {
    const baseTabs = [
      {
        tabName: "Profile",
        tabBody: (
          <UserInfo
            user={user}
            authUserFollowings={authUserFollowings}
            authUserId={authUserId}
            userGamesLength={userGamesLength}
            logs={logs}
          />
        ),
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          pushTab("profile");
        },
      },
      ...userListCategories.map((tabName, _i) => ({
        tabName: commonUtils.upFL(tabName),
        tabBody: (
          <UserGames
            userId={user._id}
            gamesCategory={tabName}
            gamesRating={user.gamesRating}
          />
        ),
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          pushTab(tabName.toLowerCase(), 1);
        },
      })),
    ];

    if (profile?.userName === user.userName) {
      baseTabs.push({
        tabName: "Settings",
        tabBody: <Settings avatar={avatar} setAvatar={setAvatar} />,
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          pushTab("settings");
        },
      });
    }
    return baseTabs;
  }, [
    user.userName,
    user._id,
    user.gamesRating,
    userGamesLength,
    avatar,
    logs,
    profile?.userName,
    pushTab,
  ]);

  useEffect(() => {
    setAvatar(
      user.profilePicture
        ? `https://api.mooncellar.space/photos/${user.profilePicture}`
        : ""
    );
  }, [user.profilePicture]);

  return (
    <div className={styles.container}>
      <div
        className={classNames(styles.container__bg, {
          [styles.container__bg_active]: isImageReady,
        })}
      >
        <Image
          onLoad={() => setIsImageReady(true)}
          alt="Background"
          src={"/images/moon.jpg"}
          width={1920}
          height={1080}
        />
      </div>
      <div className={styles.content}>
        <Tabs
          defaultTabIndex={tabs.findIndex(
            (_tab) => _tab.tabName.toLowerCase() === tab
          )}
          isUseDefaultIndex
          wrapperClassName={styles.tabs}
          tabBodyClassName={styles.tabs__body}
          buttonsClassName={styles.tabs__buttons}
          contents={tabs}
        />
        <Scrollbar />
      </div>
    </div>
  );
};

export default UserProfile;
