import { CSSProperties, FC } from "react";
import styles from "./Cover.module.scss";
import Image from "next/image";

interface CoverProps {
  className?: string;
  isWithoutText?: boolean;
  style?: CSSProperties;
}
export const Cover: FC<CoverProps> = ({ className, isWithoutText, style }) => {
  return (
    <div className={`${styles.cover} ${className}`} style={style}>
      <div className={styles.cover__image}>
        <Image alt="cover" src={"/images/mooncellar.ico"} fill />
      </div>
      {!isWithoutText && <span>Cover Missing</span>}
    </div>
  );
};
