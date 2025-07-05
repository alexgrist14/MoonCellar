import { CSSProperties, FC } from "react";
import { SvgLogo } from "../svg";
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
      <Image
        alt="cover"
        width={100}
        height={100}
        src={"/images/mooncellar.ico"}
      />
      {/* <SvgLogo /> */}

      {!isWithoutText && <span>Cover Missing</span>}
    </div>
  );
};
