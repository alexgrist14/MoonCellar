import { useAuth } from "@/src/lib/shared/hooks/auth";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useCommonStore } from "@/src/lib/shared/store/common.store";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { Button } from "@/src/lib/shared/ui/Button";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/shared/ui/SearchModal";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { SvgSearch } from "@/src/lib/shared/ui/svg";
import { GetServerSidePropsContext } from "next";
import Link from "next/link";
import { useRouter } from "next/router";
import { FC, MouseEvent, useState } from "react";
import styles from "./Header.module.scss";

export const Header: FC = () => {
  const router = useRouter();

  const { isMobile } = useCommonStore();
  

  const [isMenuActive, setIsMenuActive] = useState(false);
  const { isAuth, profile } = useAuthStore();
  const { push } = useRouter();

  const handleProfileClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isAuth || !profile) {
      e.preventDefault()
      modal.open(<AuthModal />);
    }
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
        <Link href={`/user/${profile?.userName}`} onClick={handleProfileClick} className={styles.profile__link}>
        <Avatar user={profile}/>
        </Link>
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
