import { FC, useEffect } from "react";
import styles from "./Header.module.scss";
import Link from "next/link";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { Button } from "@/src/lib/shared/ui/Button";
import { SvgSearch } from "@/src/lib/shared/ui/svg";
import { useRouter } from "next/router";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { jwtDecode } from "jwt-decode";
import { isTokenExpired } from "@/src/lib/shared/utils/token";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { getCookie } from "@/src/lib/shared/utils/getCookie";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/shared/ui/SearchModal";

export const Header: FC = () => {
  const { isMobile } = useCommonStore();
  const { setAuth, isAuth, setUserId, userId } = useAuthStore();
  const { push } = useRouter();

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
    push(`/user/${userId}`);
  };

  const searchClickHandler = () => {
    modal.open(<SearchModal />);
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
