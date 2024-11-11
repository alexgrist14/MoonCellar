import { Dispatch, FC, SetStateAction, useState } from "react";
import styles from "./UserInfo.module.scss";
import {
  categoriesType,
  UserGamesType,
} from "@/src/lib/shared/types/user.type";
import Image from "next/image";
import { IGDBGame } from "@/src/lib/shared/types/igdb";
import { SvgBan, SvgDone, SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import { Button } from "@/src/lib/shared/ui/Button";
import Link from "next/link";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { userListCategories } from "@/src/lib/shared/constants/user.const";
import { commonUtils } from "@/src/lib/shared/utils/common";
import { useWindowResizeAction } from "@/src/lib/shared/hooks";
import { screenGt } from "@/src/lib/shared/constants";

interface UserInfoProps {
  userName: string;
  _id: string;
  games: UserGamesType;
  avatar?: string;
  setTabIndex: Dispatch<SetStateAction<number>>;
}

const UserInfo: FC<UserInfoProps> = ({
  games,
  userName,
  _id: id,
  avatar,
  setTabIndex,
}) => {
  const [userGames, setUserGames] = useState<UserGamesType>(games);
  const [template, setTemplate] = useState<string>("repeat(10, 1fr)");
  const [slicedUserGames, setSlicedUserGames] = useState<UserGamesType>();

  const handleShowMoreClick = (i: number) => {
    setTabIndex(i);
  };

  useWindowResizeAction(() => {
    const temp = structuredClone(userGames);
    console.log(window.screenX)
    if (window.screenX < screenGt) {
      setTemplate("repeat(6, 1fr)");
      Object.keys(userGames).forEach((key) => {
        const tempKey = key as categoriesType;
        temp[tempKey] = userGames[tempKey].slice(0, 4);
      });
      setSlicedUserGames(temp);
    }
  });

  return (
    <>
      <div className={styles.content__top}>
        <div className={styles.profile_info}>
          <div className={styles.profile_image}>
            <Image
              src={avatar || "/images/user.png"}
              width={160}
              height={160}
              alt="profile"
              className={styles.image}
            />
          </div>
          <div>
            <div className={styles.profile_name}>{userName}</div>
            <div className={styles.profile_stats}>
              <h3 className={styles.profile_stats__title}>Games stats</h3>
              <div className={styles.profile_stats__list}>
                <Link href="completed">
                  <SvgDone className={styles.completed} />
                  <span>Completed: {games.completed.length}</span>
                </Link>
                <Link href="playing">
                  <SvgPlay className={styles.playing} />
                  <span>Playing: {games.playing.length}</span>
                </Link>
                <Link href="wishlist">
                  <SvgStar className={styles.wishlist} />
                  <span>Wishlist: {games.wishlist.length}</span>
                </Link>
                <Link href="dropped">
                  <SvgBan className={styles.dropped} />
                  <span>Dropped: {games.dropped.length}</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className={styles.friends}>
          <h3 className={styles.friends_title}>Friends</h3>
          <div className={styles.friends_list}>
            <div className={styles.friends_list__item}>Aboba</div>
            <div className={styles.friends_list__item}>UselessMouth</div>
            <div className={styles.friends_list__item}>Patrego</div>
            <div className={styles.friends_list__item}>Canadian</div>
            <div className={styles.friends_list__item}>Anglosax</div>
          </div>
        </div>
      </div>
      {/* <div className={styles.content__bottom}>
        {!!slicedUserGames &&
          userListCategories.map(
            (category, i) =>
              !!slicedUserGames[category].length && (
                <div key={category} className={styles.games}>
                  <h3 className={styles.games_title}>
                    {commonUtils.upFL(category)}
                  </h3>
                  <div
                    className={styles.games_list}
                    style={{ gridTemplateColumns: template }}
                  >
                    {slicedUserGames[category].map((game, i) => (
                      <div key={i} className={styles.games_list__item}>
                        <GameCard game={game} />
                      </div>
                    ))}
                    {userGames[category].length > 10 && (
                      <Button
                        className={styles.more}
                        onClick={() => handleShowMoreClick(i + 1)}
                      >
                        Show More
                      </Button>
                    )}
                  </div>
                </div>
              )
          )}
      </div> */}
    </>
  );
};

export default UserInfo;
