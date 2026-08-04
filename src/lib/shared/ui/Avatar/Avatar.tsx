import Image from "next/image";
import classNames from "classnames";
import { FC, useRef, useState } from "react";
import { IUser } from "../../types/auth.type";
import { SvgProfile } from "../svg";
import { Tooltip } from "../Tooltip";
import styles from "./Avatar.module.scss";

interface AvatarProps {
  user?: Pick<IUser, "_id" | "userName" | "avatar">;
  isWithoutTooltip?: boolean;
  isWithoutHover?: boolean;
  priority?: boolean;
}

const Avatar: FC<AvatarProps> = ({
  user,
  isWithoutTooltip,
  isWithoutHover,
  priority,
}) => {
  const [isTooltipActive, setIsTooltipActive] = useState(false);
  const followingsRef = useRef<HTMLDivElement>(null);

  return (
    <div
      className={styles.container}
      ref={followingsRef}
      onMouseOver={() => setIsTooltipActive(true)}
      onMouseOut={() => setIsTooltipActive(false)}
    >
      {!!user?.avatar ? (
        <Image
          className={classNames(styles.image, {
            [styles.image_static]: isWithoutHover,
          })}
          src={user.avatar}
          width={90}
          height={90}
          alt="profile"
          priority={priority}
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
