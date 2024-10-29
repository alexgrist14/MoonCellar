import { FC, useEffect, useState } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { Button } from "@/src/lib/shared/ui/Button";
import { SvgProfile, SvgSearch } from "@/src/lib/shared/ui/svg";
import { useRouter } from "next/router";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { jwtDecode } from "jwt-decode";
import { isTokenExpired } from "@/src/lib/shared/utils/token";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { getCookie } from "@/src/lib/shared/utils/getCookie";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/shared/ui/SearchModal";
import { API_URL } from "@/src/lib/shared/constants";
import { getAvatar } from "@/src/lib/shared/api/avatar";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import { logout } from "@/src/lib/shared/api";

export const Header: FC = () => {
  const { isMobile } = useCommonStore();
  const [isMenuActive, setIsMenuActive] = useState(false);
  const {
    setAuth,
    isAuth,
    setUserId,
    userId,
    profilePicture,
    setProfilePicture,
  } = useAuthStore();
  const { push } = useRouter();

  useEffect(() => {
    const token = getCookie("refreshMoonToken");
    if (token) {
      const decoded: any = jwtDecode(token);
      if (decoded.exp) {
        setAuth(!isTokenExpired(decoded.exp));
        setUserId(decoded.id);
      }
    }else{
      setAuth(false);
      setUserId("");
    }
  }, [setAuth, setUserId]);

  useEffect(() => {
    if (userId) {
      (async () => {
        await getAvatar(userId).then((res) => {
          setProfilePicture(`${API_URL}/photos/${res.fileName}`);
        }).catch(()=>{setProfilePicture('')});
      })();
    }
  }, [setProfilePicture, userId]);

  const handleProfileClick = () => {
    if (isAuth){
      push(`/user/${userId}`);
    } 
    else modal.open(<AuthModal />);
  };

  const searchClickHandler = () => {
    modal.open(<SearchModal />);
  };

  const handleLogoutClick = () => {
    if (isAuth && userId) logout(userId);
  };

  return (
    <div className={styles.container}>
      <div className={styles.container__left}>
        <Link href="/" className={styles.title}>
          MoonCellar
        </Link>
        <Separator />
        <Button color="transparent" onClick={searchClickHandler}>
          <SvgSearch className={styles.svg} />
        </Button>
      </div>
      <div className={styles.container__right}>
        {isAuth ? (
          <div
            className={styles.profile}
            onMouseLeave={() => setIsMenuActive(false)}
            onClick={handleProfileClick}
          >
            <Image
              className={styles.profile_image}
              onMouseEnter={() => setIsMenuActive(true)}
              src={!!profilePicture ? profilePicture : "/images/user.png"}
              width={40}
              height={40}
              alt="profile"
            />
            <div
              className={`${styles.dropdown} ${isMenuActive && styles.active}`}
            >
              <Link className={styles.dropdown_item} href="/user">
                Profile
              </Link>
              <Link className={styles.dropdown_item} href="/settings">
                Settings
              </Link>
              <Link className={styles.dropdown_item} href="/gauntlet" onClick={handleLogoutClick}>
                Logout
              </Link>
            </div>
          </div>
        ) : (
          <div onClick={handleProfileClick}>
            <SvgProfile className={styles.profile_image} />
          </div>
        )}
      </div>
    </div>
  );
};
