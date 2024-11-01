import { ChangeEvent, FC, useEffect, useState } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";
import { SvgCamera } from "../../shared/ui/svg";
import { toast } from "../../shared/utils/toast";
import { Button } from "../../shared/ui/Button";
import { useAuthStore } from "../../shared/store/auth.store";
import { addAvatar, getAvatar } from "../../shared/api/avatar";
import { API_URL } from "../../shared/constants";

interface UserProfileProps {
  name: string;
  email: string;
  id: string;
}

const UserProfile: FC<UserProfileProps> = ({ email, name, id }) => {
  const { userId, profilePicture, setProfilePicture } = useAuthStore();

  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);
  const [avatar, setAvatar] = useState<string | undefined>(profilePicture);
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [profileHover, setProfileHover] = useState<boolean>(false);

  const handleUpload = async () => {
    if (userId && tempAvatar) {
      await addAvatar(userId, tempAvatar);
    }
  };

  const handleInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      const file = event.target.files[0];
      const fileSize = Math.round(file.size / 1024);
      console.log(fileSize);

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
    (async () => {
      await getAvatar(id)
        .then((res) => {
          setAvatar(`${API_URL}/photos/${res.fileName}`);
        })
        .catch(() => {
          setProfilePicture("");
        });
    })();
  }, [id, setProfilePicture]);

  useEffect(() => {
    if (!isPictureLarge) handleUpload();
  }, [tempAvatar]);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.content__top}>
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
                !!avatar
                  ? avatar
                  : !!tempAvatar
                  ? URL.createObjectURL(tempAvatar)
                  : "/images/user.png"
              }
              width={160}
              height={160}
              alt="profile"
              className={styles.profile_image}
            />
            <div
              className={`${styles.background} ${profileHover && styles.hover}`}
            ></div>
            <SvgCamera
              className={`${styles.svg} ${profileHover && styles.hover_svg}`}
            />
          </div>
          {isPictureLarge && (
            <p className={styles.error}>Avatar must me smaller than 1mb</p>
          )}
          <input type="file" id="avatar" hidden onChange={handleInput} accept="image/jpeg,image/png,image/jpg,image/webp" />
        </label>

        <div className={styles.profile_info}>
          <div className={styles.profile_name}>{name}</div>
          <div className={styles.profile_email}>{email}</div>
        </div>
        <div className={styles.history}>

        </div>
        </div>
          <div className={styles.content__bottom}>
            
          </div>
      </div>
    </div>
  );
};

export default UserProfile;
