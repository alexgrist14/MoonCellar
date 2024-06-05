import { FC } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";

const UserProfile: FC = ()=>{
    return(
        <div className={styles.container}>
            <div className={styles.profile_image}><Image src='' alt="profile"></Image></div>
        </div>
    )
}

export default UserProfile;