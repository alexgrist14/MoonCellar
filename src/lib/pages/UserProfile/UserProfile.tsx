import Image from "next/image";
import { useRouter } from "next/router";
import queryString from "query-string";
import { FC, useCallback, useMemo, useState } from "react";
import { userListCategories } from "../../shared/constants/user.const";
import { IUser } from "../../shared/types/auth";
import { ITabContent } from "../../shared/types/tabs";
import { IFollowings, ILogs } from "../../shared/types/user.type";
import { Scrollbar } from "../../shared/ui/Scrollbar";
import { Tabs } from "../../shared/ui/Tabs";
import { commonUtils } from "../../shared/utils/common";
import { Settings } from "./Settings";
import { UserGames } from "./UserGames";
import UserInfo from "./UserInfo/UserInfo";
import styles from "./UserProfile.module.scss";
import cn from "classnames";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";

interface UserProfileProps {
  user: IUser;
  logs: ILogs[];
  authUserFollowings: IFollowings;
  authUserId: string;
}

const UserProfile: FC<UserProfileProps> = ({
  user,
  logs,
  authUserFollowings,
  authUserId,
}) => {
  const { query, push, pathname } = useRouter();

  const [isImageReady, setIsImageReady] = useState(false);

  const tab = !!query?.list ? (query.list as string) : "profile";

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

  const tabs = useMemo((): ITabContent[] => {
    const baseTabs = [
      {
        tabName: "Profile",
        tabBody: (
          <UserInfo
            user={user}
            authUserFollowings={authUserFollowings}
            authUserId={authUserId}
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

    if (authUserId === user._id) {
      baseTabs.push({
        tabName: "Settings",
        tabBody: <Settings />,
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          pushTab("settings");
        },
      });
    }
    return baseTabs;
  }, [user, authUserFollowings, authUserId, logs, pushTab]);

  return (
    <div className={cn(styles.container)}>
      <div
        className={cn(styles.container__bg, {
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
      <WrapperTemplate classNameContent={styles.content}>
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
      </WrapperTemplate>
    </div>
  );
};

export default UserProfile;
