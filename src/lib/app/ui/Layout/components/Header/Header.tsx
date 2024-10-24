import { FC, useEffect } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { Button } from "@/src/lib/shared/ui/Button";
import { SvgMenu, SvgSearch } from "@/src/lib/shared/ui/svg";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useRouter } from "next/router";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { jwtDecode } from "jwt-decode";
import { isTokenExpired } from "@/src/lib/shared/utils/token";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { getCookie } from "@/src/lib/shared/utils/getCookie";

export const Header: FC = () => {
  const { asPath } = useRouter();
  const { isMobile } = useCommonStore();
  const { setAuth, isAuth, setUserId, userId } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    const token = getCookie("refresh_token");
    if (token) {
      const decoded: any = jwtDecode(token);
      console.log(decoded);
      if (decoded.exp) {
        setAuth(!isTokenExpired(decoded.exp));
        setUserId(decoded.id);
      }
    }
  }, [setAuth, setUserId]);

  const handleProfileClick = () => {
    router.push(`/user/${userId}`);
  };

  const tabs = [
    { tabName: "Home", tabLink: "/" },
    { tabName: "Gauntlet", tabLink: "/gauntlet" },
    { tabName: "Games", tabLink: "/games" },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.container__left}>
        <Link href="/" className={styles.title}>
          MoonCellar
        </Link>
        {!isMobile && (
          <>
            <Separator />
            <Button color="transparent">
              <SvgSearch className={styles.svg} />
            </Button>
          </>
        )}
      </div>
      <div className={styles.container__right}>
        {isMobile ? (
          <>
            <Button color="transparent">
              <SvgSearch className={styles.svg} />
            </Button>
            <Separator />
            <Button color="transparent">
              <SvgMenu className={styles.svg} />
            </Button>
          </>
        ) : (
          <>
            <Tabs
              isUseDefaultIndex
              defaultTabIndex={tabs.findIndex((tab) => tab.tabLink === asPath)}
              contents={tabs}
            />
          </>
        )}
        {isAuth && (
          <div className={styles.profile} onClick={handleProfileClick}>
            <Image
              src={"/images/user.png"}
              width={40}
              height={40}
              alt="profile"
            />
          </div>
        )}
      </div>
    </div>
  );
};
