import Image from "next/image";
import { ChangeEvent, FC, useCallback, useEffect, useState } from "react";
import { userAPI } from "../../api";
import { useAuthStore } from "../../store/auth.store";
import { SvgCamera } from "../svg";
import styles from "./AvatarSettings.module.scss";

interface AvatarSettingsProps {}

const AvatarSettings: FC<AvatarSettingsProps> = ({}) => {
  const [profileHover, setProfileHover] = useState<boolean>(false);

  const { profile, setProfile } = useAuthStore();

  const [tempAvatar, setTempAvatar] = useState<File>();
  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);

  const { addAvatar } = userAPI;

  const handleUpload = useCallback(async () => {
    if (!!profile && tempAvatar) {
      await addAvatar(profile._id, tempAvatar);
    }
  }, [addAvatar, profile, tempAvatar]);

  useEffect(() => {
    if (!isPictureLarge) handleUpload();
  }, [handleUpload, isPictureLarge, tempAvatar]);

  const handleInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      const file = event.target.files[0];
      const fileSize = Math.round(file.size / 1024);

      if (fileSize > 2048) {
        setIsPictureLarge(true);
      } else {
        setTempAvatar(file);
        !!profile && setProfile({ ...profile, profilePicture: "" });
        setIsPictureLarge(false);
        handleUpload();
      }
    }
  };

  return (
    <label htmlFor="avatar" className={styles.label}>
      <div
        className={styles.holder}
        onMouseOut={() => {
          setProfileHover(false);
        }}
        onMouseOver={() => {
          setProfileHover(true);
        }}
      >
        <Image
          src={
            profile?.profilePicture
              ? `https://api.mooncellar.space/photos/${profile.profilePicture}`
              : !!tempAvatar
              ? URL.createObjectURL(tempAvatar)
              : "/images/user.png"
          }
          width={160}
          height={160}
          alt="profile"
          className={styles.image}
        />
        <div
          className={`${styles.background} ${profileHover && styles.hover}`}
        ></div>
        <SvgCamera
          className={`${styles.svg} ${profileHover && styles.hover_svg}`}
        />
      </div>
      {isPictureLarge && (
        <p className={styles.error}>Avatar must me smaller than 2mb</p>
      )}
      <input
        type="file"
        id="avatar"
        hidden
        onChange={handleInput}
        accept="image/jpeg,image/png,image/jpg,image/webp"
      />
    </label>
  );
};

export default AvatarSettings;
