import Image from "next/image";
import { ChangeEvent, Dispatch, FC, SetStateAction, useState } from "react";
import { useAuthStore } from "../../store/auth.store";
import { SvgCamera } from "../svg";
import styles from "./AvatarSettings.module.scss";
import { commonUtils } from "../../utils/common";

interface AvatarSettingsProps {
  tempAvatar?: File;
  setTempAvatar?: Dispatch<SetStateAction<File | undefined>>;
}

const AvatarSettings: FC<AvatarSettingsProps> = ({
  tempAvatar,
  setTempAvatar,
}) => {
  const [isError, setIsError] = useState(false);
  const [profileHover, setProfileHover] = useState<boolean>(false);

  const { profile, setProfile } = useAuthStore();

  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);

  const handleInput = async (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      const file = event.target.files[0];
      const fileSize = Math.round(file.size / 1024);

      if (fileSize > 2048) {
        setIsPictureLarge(true);
        setTempAvatar && setTempAvatar(undefined);
      } else {
        setTempAvatar && setTempAvatar(file);
        !!profile && setProfile({ ...profile, profilePicture: "" });
        setIsPictureLarge(false);
      }
    }
  };

  if (!profile) return null;

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
            !!tempAvatar
              ? URL.createObjectURL(tempAvatar)
              : isError
                ? "/images/user.png"
                : commonUtils.getAvatar(profile)
          }
          onError={() => setIsError(true)}
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
