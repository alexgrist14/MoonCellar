import React, { FC } from "react";
import Image from "next/image";
import { useAuthStore } from "../../store/auth.store";
import { API_URL } from "../../constants";
import { SvgProfile } from "../svg";
import styles from "./Avatar.module.scss";
import { IUser } from "../../types/auth";

interface AvatarProps {
  user?: Pick<IUser, "_id" | "userName" | "profilePicture">;
}

const Avatar: FC<AvatarProps> = ({ user }) => {
  return (
      <div className={styles.container}>
        {user?.profilePicture? (
          <Image
            className={styles.image}
            src={`https://api.mooncellar.space/photos/${user.profilePicture}`
            }
            width={90}
            height={90}
            alt="profile"
          />
        ) : (
          <div className={styles.placeholder__container}>
            <SvgProfile className={styles.placeholder} />
          </div>
        )}
      </div>
  );
};

export default Avatar;
