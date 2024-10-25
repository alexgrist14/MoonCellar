import { ChangeEvent, FC, useState } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";
import { SvgCamera } from "../../shared/ui/svg";

interface UserProfileProps {
  name: string;
  email: string;
}

const UserProfile: FC<UserProfileProps> = ({ email, name }) => {
  const [isPictureLarge, setIsPictureLagre] = useState<boolean>(false);
  const [profileHover,setProfileHover] = useState<boolean>(false);
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files !== null) {
      const fileSize = Math.round(event.target.files[0].size / 1024);
      if (fileSize > 1024) setIsPictureLagre(true);
    } else setIsPictureLagre(false);
  };
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.profile_image} onMouseOut={()=>{setProfileHover(false)}} onMouseOver={()=>{setProfileHover(true)}}>
          <Image
            src="/images/user.png"
            width={150}
            height={150}
            alt="profile"
          />
          <div className={`${styles.background} ${profileHover && styles.hover}`} >
          </div>
          <SvgCamera className={`${styles.svg} ${profileHover && styles.hover_svg}`} />
        </div>
        <input type="file" onChange={handleInput} />
        <div className={styles.profile_info}>
          <div className={styles.profile_name}>{name}</div>
          <div className={styles.profile_email}>{email}</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
