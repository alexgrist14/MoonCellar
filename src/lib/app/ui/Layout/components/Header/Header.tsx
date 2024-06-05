import { FC } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import Input from "@/src/lib/shared/ui/Input/Input";

const Header: FC = ()=>{
    return(
        <div className={styles.container}>
            <Link href='/' className={styles.wheel_link}>Wheel</Link>
            <Input onChange={()=>{}} width={200} height={30}/>
            <div>
            <Link href='/auth' className={styles.profile_link}>SingUp</Link>
            <Link href='/users' className={styles.profile_link}>Profile</Link>
            </div>
        </div>
    )
}

export default Header;