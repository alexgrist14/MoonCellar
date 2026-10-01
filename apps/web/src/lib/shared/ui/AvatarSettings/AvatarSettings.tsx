import Image from "next/image";
import {
  ChangeEvent,
  Dispatch,
  FC,
  SetStateAction,
  useEffect,
  useId,
  useState,
} from "react";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { SvgCamera } from "../svg";
import styles from "./AvatarSettings.module.scss";

interface AvatarSettingsProps {
  tempAvatar?: File;
  setTempAvatar?: Dispatch<SetStateAction<File | undefined>>;
}

export const AvatarSettings: FC<AvatarSettingsProps> = ({
  tempAvatar,
  setTempAvatar,
}) => {
  const [profileHover, setProfileHover] = useState<boolean>(false);

  const { profile, setProfile } = useAuthStore();

  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);
  const [previewUrl, setPreviewUrl] = useState<string>();
  const inputId = useId();

  useEffect(() => {
    if (!tempAvatar) {
      setPreviewUrl(undefined);
      return;
    }
    const url = URL.createObjectURL(tempAvatar);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [tempAvatar]);

  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.size > 2048 * 1024) {
      setIsPictureLarge(true);
      setTempAvatar?.(undefined);
    } else {
      setTempAvatar?.(file);
      !!profile && setProfile({ ...profile, avatar: "" });
      setIsPictureLarge(false);
    }
  };

  if (!profile) {
    return (
      <div className={`${styles.holder} ${styles.skeleton}`} aria-busy="true" />
    );
  }

  return (
    <label htmlFor={inputId} className={styles.label}>
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
            previewUrl
              ? previewUrl
              : !profile.avatar
                ? "/images/user.png"
                : profile.avatar
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
        <p className={styles.error}>Avatar must be smaller than 2 MB</p>
      )}
      <input
        type="file"
        id={inputId}
        hidden
        onChange={handleInput}
        accept="image/jpeg,image/png,image/jpg,image/webp"
      />
    </label>
  );
};
