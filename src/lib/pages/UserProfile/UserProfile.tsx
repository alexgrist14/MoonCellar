import { ChangeEvent, FC, useState } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";
import { SvgCamera } from "../../shared/ui/svg";
import { toast } from "../../shared/utils/toast";
import { StaticImport } from "next/dist/shared/lib/get-img-props";
import { Button } from "../../shared/ui/Button";

interface UserProfileProps {
  name: string;
  email: string;
}

const UserProfile: FC<UserProfileProps> = ({ email, name }) => {
  const [isPictureLarge, setIsPictureLarge] = useState<boolean>(false);
  const [tempAvatar, setTempAvatar] = useState<File>();
  const [profileHover, setProfileHover] = useState<boolean>(false);
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      const file = event.target.files[0];
      const fileSize = Math.round(event.target.files[0].size / 1024);
      
      if (fileSize > 1024){
        setIsPictureLarge(true);
      } else{
        setTempAvatar(file);
        setIsPictureLarge(false);
      }

    }
  };
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <label htmlFor="avatar" className={styles.profile_label}>
          <div
            className={styles.profile_image}
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
                  : "/images/user.png"
              }
              width={160}
              height={160}
              alt="profile"
            />
            <div
              className={`${styles.background} ${profileHover && styles.hover}`}
            ></div>
            <SvgCamera
              className={`${styles.svg} ${profileHover && styles.hover_svg}`}
            />
                      
          </div>
          {tempAvatar && !isPictureLarge && <Button>Upload</Button>}
          {isPictureLarge && (
            <p className={styles.error}>Avatar must me smaller than 1mb</p>
          )}
          <input type="file" id="avatar" hidden onChange={handleInput} />
        </label>
        <div className={styles.profile_info}>
          <div className={styles.profile_name}>{name}</div>
          <div className={styles.profile_email}>{email}</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
