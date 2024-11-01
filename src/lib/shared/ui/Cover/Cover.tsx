import { FC } from "react";
import { SvgLogo } from "../svg";

interface CoverProps{
 className: string;
}
export const Cover: FC<CoverProps> = ({className})=>{
    return(
        <div className={className}>
            <SvgLogo/>
            <span>Cover Missing</span>
        </div>
    )
}