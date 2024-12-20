import { FC, useEffect, useMemo, useState } from "react";
import styles from "./UserProfile.module.scss";
import { IGamesRating, UserGamesType } from "../../shared/types/user.type";
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

interface UserProfileProps {
  userName: string;
  _id: string;
  games: UserGamesType;
  profilePicture: string;
  gamesRating: IGamesRating[];
}

const UserProfile: FC<UserProfileProps> = ({
  userName,
  _id,
  games,
  profilePicture,
  gamesRating,
}) => {
  const [avatar, setAvatar] = useState<string | undefined>("");
  const [tabIndex, setTabIndex] = useState(0);
  const { query, replace } = useRouter();

  const tabs = useMemo((): ITabContent[] => {
    return [
      {
        tabName: "Profile",
        tabBody: (
          <UserInfo
            userName={userName}
            _id={_id}
            games={games}
            avatar={avatar}
            setTabIndex={setTabIndex}
          />
        ),
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          replace(`/user/${userName}?list=profile`);
          setTabIndex(0);
        },
      },
      ...userListCategories.map((tabName, _i) => ({
        tabName: commonUtils.upFL(tabName),
        tabBody: (
          <UserGames
            userGames={games}
            gamesCategory={tabName}
            gamesRating={gamesRating}
          />
        ),
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          replace(`/user/${userName}?list=${tabName.toLowerCase()}`);
          setTabIndex(_i + 1);
        },
      })),

      {
        tabName: "Settings",
        tabBody: <Settings avatar={avatar} setAvatar={setAvatar} />,
        className: `${styles.tabs__button}`,
        onTabClick: () => {
          replace(`/user/${userName}?list=settings`);
          setTabIndex(userListCategories.length + 1);
        },
      },
    ];
  }, [userName, _id, games, avatar, replace, gamesRating]);

  useEffect(() => {
    !!query?.list
      ? setTabIndex(
          tabs.findIndex(
            (tab) => tab.tabName.toLowerCase() === (query.list as string)
          )
        )
      : setTabIndex(0);
  }, [query, tabs]);

  useEffect(() => {
    setAvatar(
      profilePicture
        ? `https://api.mooncellar.space/photos/${profilePicture}`
        : ""
    );
  }, [profilePicture]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Tabs
          defaultTabIndex={tabIndex}
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
