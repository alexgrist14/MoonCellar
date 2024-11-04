import { ChangeEvent, FC, useEffect, useState } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";
import {
  SvgBan,
  SvgCamera,
  SvgDone,
  SvgPlay,
  SvgStar,
} from "../../shared/ui/svg";
import { Button } from "../../shared/ui/Button";
import { useAuthStore } from "../../shared/store/auth.store";
import { API_URL, mockGame } from "../../shared/constants";
import Link from "next/link";
import { GameCard } from "../../shared/ui/GameCard";
import { userAPI } from "../../shared/api";

interface UserProfileProps {
  name: string;
  email: string;
  _id: string;
}

const UserProfile: FC<UserProfileProps> = ({ name, _id: id }) => {
  const { profile } = useAuthStore();
  const { addAvatar } = userAPI;

  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);
  const [avatar, setAvatar] = useState<string | undefined>("");
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [profileHover, setProfileHover] = useState<boolean>(false);

  const handleUpload = async () => {
    if (profile && tempAvatar) {
      await addAvatar(profile._id, tempAvatar);
    }
  };

  useEffect(() => {
    if (profile) setAvatar(`${API_URL}/photos/${profile.profilePicture}`);
  }, [profile]);

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

  useEffect(() => {
    if (profile) setAvatar(`${API_URL}/photos/${profile.profilePicture}`);
  }, []);

  useEffect(() => {
    if (!isPictureLarge) handleUpload();
  }, [tempAvatar]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
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
                  className={`${styles.svg} ${
                    profileHover && styles.hover_svg
                  }`}
                />
              </div>
              <Button>Settings</Button>
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
              <div className={styles.profile_name}>{name}</div>
              <div className={styles.profile_stats}>
                <h3 className={styles.profile_stats__title}>Games stats</h3>
                <div className={styles.profile_stats__list}>
                  <Link href="completed">
                    <SvgDone className={styles.completed} />
                    <span>Completed: 1984</span>
                  </Link>
                  <Link href="playing">
                    <SvgPlay className={styles.playing} />
                    <span>Playing: 1</span>
                  </Link>
                  <Link href="wishlist">
                    <SvgStar className={styles.wishlist} />
                    <span>Wishlist: 22</span>
                  </Link>
                  <Link href="dropped">
                    <SvgBan className={styles.dropped} />
                    <span>Dropped: ∞</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
          <div className={styles.history}>
            <Link className={styles.history_link} href="/history">
              history
            </Link>
            <div className={styles.history_list}>
              <li>
                <div className={styles.card}>
                  <GameCard game={mockGame} />
                </div>
                <span>Dragon ball</span>
              </li>
              <li>
                <div className={styles.card}>
                  <GameCard game={mockGame} />
                </div>
                <span>Silent hill</span>
              </li>
              <li>
                <div className={styles.card}>
                  <GameCard game={mockGame} />
                </div>
                <span>Summertime saga</span>
              </li>
            </div>
          </div>
        </div>
        <div className={styles.content__bottom}>
          <div className={styles.favorites}>
            <h3 className={styles.favorites_title}>Favorite games</h3>
            <div className={styles.favorites_list}>
              <div className={styles.favorites_list__item}>
                <GameCard game={mockGame} />
              </div>
              <div className={styles.favorites_list__item}>
                <GameCard game={mockGame} />
              </div>
              <div className={styles.favorites_list__item}>
                <GameCard game={mockGame} />
              </div>
              <div className={styles.favorites_list__item}>
                <GameCard game={mockGame} />
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
      </div>
    </div>
  );
};

export default UserProfile;
