import { FC } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import Input from "@/src/lib/shared/ui/Input/Input";
import { InputType } from "@/src/lib/shared/types/input.enum";

const Header: FC = ()=>{
    return(
        <div className={styles.container}>
            <Link href='/' className={styles.wheel_link}>Wheel</Link>
            <Input value ={""} onChange={()=>{}} width={200} height={30}/>
            <div className={styles.links}>
            <Link href='/auth/signup' className={styles.link}>SingUp</Link>
            <Link href='/auth/login'className={styles.link}>Login</Link>
            <Link href='/users' className={styles.link}>Profile</Link>
            </div>
        </div>
    )
}

export default Header;