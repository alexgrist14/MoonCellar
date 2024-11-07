import { ChangeEvent, FC, useEffect, useState } from "react";
import styles from "./ProfileInfo.module.scss";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { API_URL } from "@/src/lib/shared/constants";
import { userAPI } from "@/src/lib/shared/api";
import { categoriesType } from "@/src/lib/shared/types/user.type";
import Image from "next/image";
import { IGDBGame } from "@/src/lib/shared/types/igdb";
import {
  SvgBan,
  SvgCamera,
  SvgDone,
  SvgPlay,
  SvgStar,
} from "@/src/lib/shared/ui/svg";
import { Button } from "@/src/lib/shared/ui/Button";
import Link from "next/link";
import { GameCard } from "@/src/lib/shared/ui/GameCard";

interface ProfileInfoProps {
  userName: string;
  _id: string;
  games: Record<categoriesType, IGDBGame[]>;
}

const ProfileInfo: FC<ProfileInfoProps> = ({ games, userName, _id: id }) => {
  const [userGames, setUserGames] =
    useState<Record<categoriesType, IGDBGame[]>>(games);
  const { profile } = useAuthStore();
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [avatar, setAvatar] = useState<string | undefined>("");
  const [profileHover, setProfileHover] = useState<boolean>(false);
  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);
  const { addAvatar, getUserGames } = userAPI;

  useEffect(() => {
    if (!isPictureLarge) handleUpload();
  }, [tempAvatar]);
  useEffect(() => {
    if (profile){
      setAvatar(`${API_URL}/photos/${profile.profilePicture}`);
      console.log(API_URL)
    console.log(`${API_URL}/photos/${profile.profilePicture}`)
    } 
    
  }, [profile]);

  const handleUpload = async () => {
    if (profile && tempAvatar) {
      await addAvatar(profile._id, tempAvatar);
    }
  };

  const handleInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      const file = event.target.files[0];
      const fileSize = Math.round(file.size / 1024);

      if (fileSize > 1024) {
        setIsPictureLarge(true);
      } else {
        setTempAvatar(file);
        setAvatar(undefined);
        setIsPictureLarge(false);
        handleUpload();
      }
    }
  };

  return (
    <>
      <div className={styles.content__top}>
        <div className={styles.profile_info}>
          <label htmlFor="avatar" className={styles.profile_label}>
            <div
              className={styles.profile_holder}
              onMouseOut={() => {
                setProfileHover(false);
              }}
              onMouseOver={() => {
                setProfileHover(true);
              }}
            >
              <Image
                src={
                  avatar ||
                  (!!tempAvatar
                    ? URL.createObjectURL(tempAvatar)
                    : "/images/user.png")
                }
                width={160}
                height={160}
                alt="profile"
                className={styles.profile_image}
              />
              <div
                className={`${styles.background} ${
                  profileHover && styles.hover
                }`}
              ></div>
              <SvgCamera
                className={`${styles.svg} ${profileHover && styles.hover_svg}`}
              />
            </div>
            {isPictureLarge && (
              <p className={styles.error}>Avatar must me smaller than 1mb</p>
            )}
            <input
              type="file"
              id="avatar"
              hidden
              onChange={handleInput}
              accept="image/jpeg,image/png,image/jpg,image/webp"
            />
          </label>
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
        {userGames.completed.length && (
          <div className={styles.games}>
            <h3 className={styles.games_title}>Completed</h3>
            <div className={styles.games_list}>
              {userGames.completed.map((game, i) => (
                <div key={i} className={styles.games_list__item}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </div>
        )}
        {!!userGames.backlog.length && (
          <div className={styles.games}>
            <h3 className={styles.games_title}>Backlog</h3>
            <div className={styles.games_list}>
              {userGames.backlog.map((game, i) => (
                <div key={i} className={styles.games_list__item}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </div>
        )}
        {!!userGames.wishlist.length && (
          <div className={styles.games}>
            <h3 className={styles.games_title}>Wishlist</h3>
            <div className={styles.games_list}>
              {userGames.wishlist.map((game, i) => (
                <div key={i} className={styles.games_list__item}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </div>
        )}
        {!!userGames.playing.length && (
          <div className={styles.games}>
            <h3 className={styles.games_title}>Playing</h3>
            <div className={styles.games_list}>
              {userGames.playing.map((game, i) => (
                <div key={i} className={styles.games_list__item}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </div>
        )}

        {!!userGames.dropped.length && (
          <div className={styles.games}>
            <h3 className={styles.games_title}>Dropped</h3>
            <div className={styles.games_list}>
              {userGames.dropped.map((game, i) => (
                <div key={i} className={styles.games_list__item}>
                  <GameCard game={game} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileInfo;
