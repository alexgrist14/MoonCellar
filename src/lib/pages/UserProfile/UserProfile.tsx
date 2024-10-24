import { FC, useState } from "react";
import styles from "./UserProfile.module.scss";
import Image from "next/image";


interface UserProfileProps {
  name: string;
  email: string;
}

const UserProfile: FC<UserProfileProps> = ({ email})=>{
    function getCookie(name: string) {
        // const matches = document.cookie.match(
        //   new RegExp(
        //     '(?:^|; )' +
        //       name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, '\\$1') +
        //       '=([^;]*)',
        //   ),
        // );
        // const res = matches ? decodeURIComponent(matches[1]) : undefined;
      
        // if (typeof res === 'string') return res;
        // if (typeof res === 'object') return JSON.parse(res);
      }
      console.log(getCookie('refreshToken'))


      
    const [token,setToken] = useState<string | undefined>('');
    const hnldClick = ()=>{
        // setToken(getCookie('refreshToken')?.toString())
        console.log('click')
    }
    console.log() 

    return(
        <div className={styles.container}>
            <div className={styles.content}>
            <div className={styles.profile_image}><Image src='/images/user.png' width={150} height={150} alt="profile"></Image></div>
            <div className={styles.profile_info}>
                <div className={styles.profile_name}>{token}</div>
                <div className={styles.profile_email}onClick={hnldClick}>{email}</div>
            </div>
            </div>
        </div>
        <div className={styles.profile_info}>
          <div className={styles.profile_name}>{name}</div>
          <div className={styles.profile_email}>{email}</div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
