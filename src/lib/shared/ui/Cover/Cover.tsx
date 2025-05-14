import { FC } from "react";
import { SvgLogo } from "../svg";
import styles from "./Cover.module.scss";
import Image from "next/image";

interface CoverProps {
  className?: string;
}
export const Cover: FC<CoverProps> = ({ className }) => {
  return (
    <div className={`${styles.cover} ${className}`}>
      <Image
        alt="cover"
        width={100}
        height={100}
        src={"/images/mooncellar.ico"}
      />
      {/* <SvgLogo /> */}

      <span>Cover Missing</span>
    </div>
  );
};
