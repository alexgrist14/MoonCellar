import { FC } from "react";
import { SvgLogo } from "../svg";
import styles from "./Cover.module.scss";

interface CoverProps{
 className?: string;
}
export const Cover: FC<CoverProps> = ({className})=>{
    return(
        <div className={`${styles.cover} ${className}`}>
            <div>
                <SvgLogo/>
            </div>
            <span>Cover Missing</span>
        </div>
    )
}