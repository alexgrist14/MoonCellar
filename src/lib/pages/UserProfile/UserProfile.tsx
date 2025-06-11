"use client";

import { FC } from "react";
import { userListCategories } from "../../shared/constants/user.const";
import { IUser } from "../../shared/types/auth";
import {
  CategoriesType,
  IFollowings,
  ILogs,
} from "../../shared/types/user.type";
import { Settings } from "./Settings";
import { UserGames } from "./UserGames";
import UserInfo from "./UserInfo/UserInfo";
import styles from "./UserProfile.module.scss";
import cn from "classnames";
import { WrapperTemplate } from "../../shared/ui/WrapperTemplate";
import { BGImage } from "../../shared/ui/BGImage";
import { ExpandMenu } from "../../shared/ui/ExpandMenu";
import { SvgBurger } from "../../shared/ui/svg";
import { useStatesStore } from "../../shared/store/states.store";
import { useParams, useSearchParams } from "next/navigation";
import { UserNavigation } from "../../features/user/ui/UserNavigation";

interface UserProfileProps {
  user: IUser;
  logs: ILogs[];
  authUserFollowings?: IFollowings;
  authUserId?: string;
}

const UserProfile: FC<UserProfileProps> = ({
  user,
  logs,
  authUserFollowings,
  authUserId,
}) => {
  const query = useSearchParams();
  const { games } = user;

  const isAuthedUser = authUserId === user._id;

  const { isMobile } = useStatesStore();

  const tab = !!query?.get("list") ? (query.get("list") as string) : "profile";

  return (
    <>
      <BGImage defaultImage={user.background || undefined} />
      <div className={cn(styles.container)}>
        {isMobile && (
          <ExpandMenu
            position="bottom-right"
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
            titleStyle={{ width: "fit-content" }}
          >
            <UserNavigation
              games={games}
              user={user}
              isAuthedUser={isAuthedUser}
            />
          </ExpandMenu>
        )}
        <WrapperTemplate classNameContent={styles.content} isWithBlur>
          {tab === "settings" && authUserId === user._id && <Settings />}
          {tab === "profile" && (
            <UserInfo
              user={user}
              authUserFollowings={authUserFollowings}
              authUserId={authUserId}
              logs={logs}
            />
          )}
          {userListCategories.some((t) => t === tab) && (
            <UserGames userId={user._id} gamesRating={user.gamesRating} />
          )}
        </WrapperTemplate>
        {!isMobile && (
          <UserNavigation
            games={games}
            user={user}
            isAuthedUser={isAuthedUser}
          />
        )}
      </div>
    </>
  );
};

export default UserProfile;
