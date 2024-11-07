import { FC } from "react";
import styles from "./UserProfile.module.scss";
import { IGDBGame } from "../../shared/types/igdb";
import { categoriesType, UserGamesType } from "../../shared/types/user.type";
import { Tabs } from "../../shared/ui/Tabs";
import { ITabContent } from "../../shared/types/tabs";
import ProfileInfo from "./ProfileInfo/ProfileInfo";
import { UserGames } from "./UserGames";
import { Settings } from "./Settings";

interface UserProfileProps {
  userName: string;
  _id: string;
  games: UserGamesType;
}

const UserProfile: FC<UserProfileProps> = ({ userName, _id, games }) => {

  const tabs: ITabContent[] = [
    {
      tabName: "Profile",
      tabBody: <ProfileInfo userName={userName} _id={_id} games={games}/>,
      className: `${styles.tabs__button}` 
    },
    { tabName: "Games List", 
      tabBody: <UserGames games={games}/>,
      className: `${styles.tabs__button}` 
    },
    { tabName: "Settings", 
      tabBody: <Settings/>,
      className: `${styles.tabs__button}` 
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
