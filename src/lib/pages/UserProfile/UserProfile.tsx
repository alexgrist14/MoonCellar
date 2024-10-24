import { FC, useState } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";

interface UserProfileProps {
  name: string;
  email: string;
}

const UserProfile: FC<UserProfileProps> = ({ email, name }) => {
  return (
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.profile_image}>
            <Image
              src="/images/user.png"
              width={150}
              height={150}
              alt="profile"
            ></Image>
          </div>
          <div className={styles.profile_info}>
            <div className={styles.profile_name}>{name}</div>
            <div className={styles.profile_email}>{email}</div>
          </div>
        </div>
      </div>
  );
};

export default UserProfile;
