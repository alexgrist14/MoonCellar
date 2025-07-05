"use client";

import { FC, useMemo } from "react";
import { userListCategories } from "../../shared/constants/user.const";
import { IUser } from "../../shared/types/auth";
import { IFollowings } from "../../shared/types/user.type";
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
import { useSearchParams } from "next/navigation";
import { UserNavigation } from "../../features/user/ui/UserNavigation";
import { IPlaythrough } from "../../shared/lib/schemas/playthroughs.schema";

interface UserProfileProps {
  user: IUser;
  authUserFollowings?: IFollowings;
  authUserId?: string;
  playthroughs: IPlaythrough[];
}

const UserProfile: FC<UserProfileProps> = ({
  user,
  authUserFollowings,
  authUserId,
  playthroughs,
}) => {
  const query = useSearchParams();
  const { isMobile } = useStatesStore();

  const isAuthedUser = useMemo(
    () => authUserId === user._id,
    [authUserId, user]
  );
  const tab = useMemo(
    () => (!!query?.get("list") ? (query.get("list") as string) : "profile"),
    [query]
  );

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
              user={user}
              isAuthedUser={isAuthedUser}
              playthroughs={playthroughs}
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
            />
          )}
          {userListCategories.some((t) => t === tab) && (
            <UserGames
              playthroughs={playthroughs}
              gamesRating={user.gamesRating}
            />
          )}
        </WrapperTemplate>
        {!isMobile && (
          <UserNavigation
            user={user}
            isAuthedUser={isAuthedUser}
            playthroughs={playthroughs}
          />
        )}
      </div>
    </>
  );
};

export default UserProfile;
