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
import { BGImage } from "../../shared/ui/BGImage";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { SvgArrow, SvgBurger, SvgPen, SvgSettings } from "../../shared/ui/svg";
import classNames from "classnames";
import { useStatesStore } from "../../shared/store/states.store";
import { Button } from "../../shared/ui/Button";
import { useSettingsStore } from "../../shared/store/settings.store";
import Link from "next/link";
import Avatar from "../../shared/ui/Avatar/Avatar";
import { modal } from "../../shared/ui/Modal";
import { CustomFolder } from "../../shared/ui/CustomFolderModal";

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
  const { games } = user;

  const isAuthedUser = authUserId === user._id;

  const { isMobile } = useStatesStore();

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

  const handleEditListClick = () => {
    modal.open(<CustomFolder />);
  };

  return (
    <div className={cn(styles.container)}>
      {isMobile && (
        <ExpandMenu
          position="right"
          menuStyle={{ width: "80%" }}
          titleClose={
            <SvgBurger
              className={styles.svg}
              topId={cn(styles.top, styles.top_active)}
              middleId={cn(styles.middle, styles.middle_active)}
              bottomId={cn(styles.bottom, styles.bottom_active)}
            />
          }
          titleOpen={
            <SvgBurger
              className={styles.svg}
              topId={cn(styles.top)}
              middleId={cn(styles.middle)}
              bottomId={cn(styles.bottom)}
            />
          }
          titleClassName={styles.expand__title}
        >
          <div className={styles.menu}>
            {userListCategories.map((tabName, i) => (
              <Button
                key={tabName + i}
                onClick={() => pushTab(tabName.toLowerCase(), 1)}
              >
                {tabName}
              </Button>
            ))}
          </div>
        </ExpandMenu>
      )}

      <BGImage />
      <WrapperTemplate
        classNameContent={styles.content}
        templateStyle={{ background: "none" }}
        contentStyle={{
          minHeight: "calc(100vh - 155px)",
        }}
      >
        <Tabs
          defaultTabIndex={tabs.findIndex(
            (_tab) => _tab.tabName.toLowerCase() === tab
          )}
          isUseDefaultIndex
          isHideTabsButtons={true}
          wrapperClassName={styles.tabs}
          tabBodyClassName={styles.tabs__body}
          buttonsClassName={styles.tabs__buttons}
          contents={tabs}
        />

        <Scrollbar />
      </WrapperTemplate>

      <div className={styles.panel__container}>
        <div className={styles.panel}>
          <Button
            className={styles.btn}
            color="transparent"
            onClick={() => pushTab("profile")}
          >
            <div>
              <div className={styles.avatar}>
                <Avatar user={user} isWithoutTooltip={true} />
              </div>
              <span>Profile</span>
            </div>
          </Button>
        </div>
        <div className={cn(styles.panel, styles.list)}>
          {userListCategories.map((category, i) => (
            <Button
              key={category + i}
              className={styles.btn}
              active={query.list === category}
              color="transparent"
              onClick={() => pushTab(category.toLowerCase(), 1)}
            >
              <span>{commonUtils.upFL(category)}</span>
              <span>{games[`${category}`].length}</span>
            </Button>
          ))}
          {isAuthedUser && (
            <Button
              color="transparent"
              className={cn(styles.btn,styles.last)}
              onClick={handleEditListClick}
            >
              <div className={styles.edit}>
                <span>Edit</span>
                <SvgPen />
              </div>
            </Button>
          )}
        </div>
        {isAuthedUser && (
          <div className={styles.panel}>
            <Button
              className={styles.btn}
              active={query.list === "settings"}
              color="transparent"
              onClick={() => pushTab("settings")}
            >
              <div>
                <SvgSettings />
                <span>Settings</span>
              </div>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
