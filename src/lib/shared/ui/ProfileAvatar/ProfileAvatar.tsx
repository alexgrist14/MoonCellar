import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useState,
} from "react";
import styles from "./ProfileAvatar.module.scss";
import Image from "next/image";
import { useAuthStore } from "../../store/auth.store";
import { userAPI } from "../../api";
import { SvgCamera } from "../svg";

interface ProfileAvatarProps {
  avatar?: string;
  setAvatar: Dispatch<SetStateAction<string | undefined>>;
}

const ProfileAvatar: FC<ProfileAvatarProps> = ({ setAvatar, avatar }) => {
  const [profileHover, setProfileHover] = useState<boolean>(false);

  const [tempAvatar, setTempAvatar] = useState<File>();
  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);

  const { profile } = useAuthStore();
  const { addAvatar } = userAPI;

  useEffect(() => {
    if (!isPictureLarge) handleUpload();
  }, [tempAvatar]);

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

  const handleUpload = async () => {
    if (profile && tempAvatar) {
      await addAvatar(profile._id, tempAvatar);
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
            avatar ||
            (!!tempAvatar
              ? URL.createObjectURL(tempAvatar)
              : "/images/user.png")
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
  );
};

export default ProfileAvatar;
