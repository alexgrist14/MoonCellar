import { FC, MouseEvent, useEffect, useState } from "react";
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
import { deleteCookie, getCookie } from "@/src/lib/shared/utils/cookies";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/shared/ui/SearchModal";
import {
  ACCESS_TOKEN,
  API_URL,
  REFRESH_TOKEN,
} from "@/src/lib/shared/constants";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import { GetServerSidePropsContext } from "next";
import { authAPI, userAPI } from "@/src/lib/shared/api";

export const Header: FC = () => {
  const router = useRouter();

  const { isMobile } = useCommonStore();
  const { logout } = authAPI;

  const [isMenuActive, setIsMenuActive] = useState(false);
  const { isAuth, profile, clear } = useAuthStore();
  const { push } = useRouter();

  const handleProfileClick = () => {
    if (isAuth && profile) {
      push(`/user/${profile.userName}`);
    } else modal.open(<AuthModal />);
  };

  const searchClickHandler = () => {
    modal.open(<SearchModal />);
  };

  const handleLogoutClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();

    if (isAuth && profile) {
      logout(profile._id).then(() => {
        deleteCookie(ACCESS_TOKEN);
        deleteCookie(REFRESH_TOKEN);
        clear();

        router.push("/");
      });
    }
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
              src={
                !!profile
                  ? `${API_URL}/photos/${profile.profilePicture}`
                  : "/images/user.png"
              }
              width={40}
              height={40}
              alt="profile"
            />
            <div
              className={`${styles.dropdown} ${isMenuActive && styles.active}`}
            >
              <Link className={styles.dropdown_item} href={`/user/${profile?.userName}`}>
                Profile
              </Link>
              <Link className={styles.dropdown_item} href="/settings">
                Settings
              </Link>
              <Link
                className={styles.dropdown_item}
                href="#"
                onClick={handleLogoutClick}
              >
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

export const getServerSideProps = async (
  context: GetServerSidePropsContext
) => {
  const cookies = context.req.headers.cookie;

  return { props: { cookies } };
};
