import { FC, useState } from "react";
import styles from "./UserInfo.module.scss";
import { categoriesType } from "@/src/lib/shared/types/user.type";
import Image from "next/image";
import { IGDBGame } from "@/src/lib/shared/types/igdb";
import { SvgBan, SvgDone, SvgPlay, SvgStar } from "@/src/lib/shared/ui/svg";
import { Button } from "@/src/lib/shared/ui/Button";
import Link from "next/link";
import { GameCard } from "@/src/lib/shared/ui/GameCard";
import { userListCategories } from "@/src/lib/shared/constants/user.const";

interface UserInfoProps {
  userName: string;
  _id: string;
  games: Record<categoriesType, IGDBGame[]>;
  avatar?: string;
}

const UserInfo: FC<UserInfoProps> = ({ games, userName, _id: id, avatar }) => {
  const [userGames, setUserGames] =
    useState<Record<categoriesType, IGDBGame[]>>(games);

  const handleShowMoreClick = async () => {};

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
      <div className={styles.content__bottom}>
        {userListCategories.map(
          (category) =>
            !!userGames[category].length && (
              <div key={category} className={styles.games}>
                <h3 className={styles.games_title}>
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </h3>
                <div className={styles.games_list}>
                  {userGames[category].slice(0, 9).map((game, i) => (
                    <div key={i} className={styles.games_list__item}>
                      <GameCard game={game} />
                    </div>
                  ))}
                  {userGames[category].length > 10 && (
                    <Button
                      className={styles.more}
                      onClick={handleShowMoreClick}
                    >
                      Show More
                    </Button>
                  )}
                </div>
              </div>
            )
        )}
      </div>
    </>
  );
};

export default UserInfo;
