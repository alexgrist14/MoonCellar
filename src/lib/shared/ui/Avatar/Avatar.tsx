import Image from "next/image";
import { FC, useRef, useState } from "react";
import { IUser } from "../../types/auth";
import { SvgProfile } from "../svg";
import { Tooltip } from "../Tooltip";
import styles from "./Avatar.module.scss";
import { commonUtils } from "../../utils/common";

interface AvatarProps {
  user?: Pick<IUser, "_id" | "userName" | "profilePicture">;
  isWithoutTooltip?: boolean;
}

const Avatar: FC<AvatarProps> = ({ user, isWithoutTooltip }) => {
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const followingsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={styles.container}
      ref={followingsRef}
      onMouseOver={() => setIsTooltipActive(true)}
      onMouseOut={() => setIsTooltipActive(false)}
    >
      {user?.profilePicture ? (
        <Image
          className={styles.image}
          src={commonUtils.getAvatar(user as IUser)}
          width={90}
          height={90}
          alt="profile"
        />
      ) : (
        <div className={styles.placeholder__container}>
          <SvgProfile className={styles.placeholder} />
        </div>
      )}
      {!isWithoutTooltip && (
        <Tooltip
          className={styles.tooltip}
          isActive={isTooltipActive}
          isFixed={false}
          positionRef={followingsRef}
        >
          {user?.userName}
        </Tooltip>
      )}
    </div>
  );
};

export default Avatar;
