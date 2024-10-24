import { FC } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { Button } from "@/src/lib/shared/ui/Button";
import { SvgMenu, SvgSearch } from "@/src/lib/shared/ui/svg";
import { useAppSelector } from "@/src/lib/app/store";
import { Tabs } from "@/src/lib/shared/ui/Tabs";
import { useRouter } from "next/router";
import Image from "next/image";
import { getCookie } from "@/src/lib/shared/utils/getCookie";
import { jwtDecode } from "jwt-decode";
import { isTokenExpired } from "@/src/lib/shared/utils/token";

export const Header: FC = () => {
  const { asPath } = useRouter();
  const { isMobile } = useAppSelector((state) => state.common);

  const token = getCookie('access_token');
  const decoded = jwtDecode(token)
 
  if(decoded.exp){
   console.log(isTokenExpired(decoded.exp))
  }

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
        <div className={styles.profile}>
          <Image src={'/images/user.png'} width={40} height={40} alt="profile"/>
        </div>
      </div>
    </div>
  );
};
