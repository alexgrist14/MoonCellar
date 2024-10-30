import { FC } from "react";
import styles from "./Cover.module.sass";
import { SvgLogo } from "../svg";

interface CoverProps{
 className: string;
}
export const Cover: FC<CoverProps> = ({className})=>{
    return(
        <div className={className}>
            <SvgLogo/>
        </div>
    )
}