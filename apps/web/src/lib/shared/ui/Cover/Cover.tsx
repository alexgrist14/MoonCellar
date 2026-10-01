import { CSSProperties, FC } from "react";
import styles from "./Cover.module.scss";
import Image from "next/image";
import classNames from "classnames";

interface CoverProps {
  className?: string;
  isWithoutText?: boolean;
  style?: CSSProperties;
}
export const Cover: FC<CoverProps> = ({ className, isWithoutText, style }) => {
  return (
    <div className={classNames(styles.cover, className)} style={style}>
      <div className={styles.cover__image}>
        <Image
          alt=""
          src="/images/logo-full.png"
          fill
          sizes="(max-width: 480px) 140px, 240px"
        />
      </div>
      {!isWithoutText && <span>Cover Missing</span>}
    </div>
  );
};
