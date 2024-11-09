import { FC, useState } from "react";
import styles from "./UserProfile.module.scss";
import { UserGamesType } from "../../shared/types/user.type";
import { Tabs } from "../../shared/ui/Tabs";
import { ITabContent } from "../../shared/types/tabs";
import ProfileInfo from "./UserInfo/UserInfo";
import { UserGames } from "./UserGames";
import { Settings } from "./Settings";
import { API_URL } from "../../shared/constants";

interface UserProfileProps {
  userName: string;
  _id: string;
  games: UserGamesType;
  profilePicture: string;
}

const UserProfile: FC<UserProfileProps> = ({
  userName,
  _id,
  games,
  profilePicture,
}) => {
  const [avatar, setAvatar] = useState<string | undefined>(
    profilePicture ? `${API_URL}/photos/${profilePicture}` : ""
  );

  const tabs: ITabContent[] = [
    {
      tabName: "Profile",
      tabBody: (
        <ProfileInfo
          userName={userName}
          _id={_id}
          games={games}
          avatar={avatar}
        />
      ),
      className: `${styles.tabs__button}`,
    },
    {
      tabName: "Games List",
      tabBody: <UserGames games={games} />,
      className: `${styles.tabs__button}`,
    },
    {
      tabName: "Settings",
      tabBody: <Settings avatar={avatar} setAvatar={setAvatar} />,
      className: `${styles.tabs__button}`,
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <Tabs
          wrapperClassName={styles.tabs}
          tabBodyClassName={styles.tabs__body}
          buttonsClassName={styles.tabs__buttons}
          contents={tabs}
        />
      </div>
    </div>
  );
};

export default UserProfile;
