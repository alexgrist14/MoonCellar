import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { useStatesStore } from "@/src/lib/shared/store/states.store";
import { AuthModal } from "@/src/lib/shared/ui/AuthModal";
import Avatar from "@/src/lib/shared/ui/Avatar/Avatar";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/shared/ui/SearchModal";
import { Separator } from "@/src/lib/shared/ui/Separator";
import { SvgAdmin, SvgSearch } from "@/src/lib/shared/ui/svg";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { FC, MouseEvent } from "react";
import styles from "./Header.module.scss";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { IButtonGroupItem } from "@/src/lib/shared/types/buttons.type";

export const Header: FC = () => {
  const { isMobile } = useStatesStore();

  const { isAuth, profile } = useAuthStore();

  const handleProfileClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (!isAuth || !profile) {
      e.preventDefault();
      modal.open(<AuthModal />);
    }
  };

  const searchClickHandler = () => {
    modal.open(<SearchModal />, { id: "search-games" });
  };

  const buttons = [
    {
      title: (
        <>
          <Icon className={styles.svg} icon="dashicons:games" />
          {!isMobile && <span>Games</span>}
        </>
      ),
      link: "/games",
      color: "transparent",
    },
    {
      title: (
        <>
          <Icon className={styles.svg} icon="ph:spinner-ball-fill" />
          {!isMobile && <span>Gauntlet</span>}
        </>
      ),
      link: "/gauntlet",
      color: "transparent",
    },
    profile?.roles?.includes("admin") && {
      title: (
        <>
          <SvgAdmin className={styles.svg} />
          {!isMobile && <span>Admin</span>}
        </>
      ),
      link: "/admin",
      color: "transparent",
    },
    {
      title: (
        <>
          <SvgSearch className={styles.svg} />
          {!isMobile && <span>Search</span>}
        </>
      ),
      onClick: searchClickHandler,
      color: "transparent",
    },
  ].filter(Boolean) as IButtonGroupItem[];

  return (
    <div className={styles.container}>
      <div className={styles.container__left}>
        <Link href="/" className={styles.title}>
          MoonCellar
        </Link>
        <Separator />
        <ButtonGroup
          wrapperClassName={styles.container__buttons}
          buttons={buttons}
        />
      </div>
      <div className={styles.container__right}>
        <Link
          href={`/user/${profile?.userName}`}
          onClick={handleProfileClick}
          className={styles.profile__link}
        >
          <Avatar user={profile} isWithoutTooltip />
        </Link>
      </div>
    </div>
  );
};
