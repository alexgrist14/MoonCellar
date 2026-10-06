import { useIsAuthHydrated } from "@/src/lib/shared/hooks/useIsAuthHydrated";
import { UserMenu } from "@/src/lib/features/user/ui/UserMenu";
import { NotificationsBell } from "@/src/lib/widgets/notifications/NotificationsBell";
import { useAuthStore } from "@/src/lib/shared/store/auth.store";
import { Box } from "@/src/lib/shared/ui/Box";
import { modal } from "@/src/lib/shared/ui/Modal";
import { SearchModal } from "@/src/lib/widgets/search/SearchModal";
import { Separator } from "@/src/lib/shared/ui/Separator";
import {
  SvgSearch,
  SvgGames,
  SvgGauntlet,
  SvgRandom,
  SvgBurger,
  SvgListBullet,
} from "@/src/lib/shared/ui/svg";
import Link from "next/link";
import Image from "next/image";
import { FC, useCallback, useMemo, useRef, useState } from "react";
import styles from "./Header.module.scss";
import { ButtonGroup } from "@/src/lib/shared/ui/Button/ButtonGroup";
import { IButtonGroupItem } from "@/src/lib/shared/types/buttons.type";
import { Button, ButtonColor } from "@/src/lib/shared/ui/Button";
import { gamesApi } from "@/src/lib/shared/api";
import { useRouter } from "next/navigation";
import { useCloseEvents } from "@/src/lib/shared/hooks/useCloseEvents";

export const Header: FC = () => {
  const isAuthHydrated = useIsAuthHydrated();
  const isAuth = useAuthStore((state) => state.isAuth);

  const router = useRouter();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useCloseEvents([menuRef], () => setIsMenuOpen(false));

  const closeMenu = useCallback(() => setIsMenuOpen(false), []);

  const searchClickHandler = useCallback(() => {
    closeMenu();
    modal.open(<SearchModal />, { id: "search-games" });
  }, [closeMenu]);

  const randomClickHandler = useCallback(async () => {
    closeMenu();
    const res = await gamesApi.getRandomSlug();

    router.push(`/games/${res.data.slug}`);
  }, [router, closeMenu]);

  const menuButtons = useMemo(
    () =>
      [
        {
          title: [
            <SvgGames key="icon" className={styles.svg} />,
            <span key="label">Games</span>,
          ],
          link: "/games",
          color: ButtonColor.TRANSPARENT,
          onClick: closeMenu,
        },
        {
          title: [
            <SvgListBullet key="icon" className={styles.svg} />,
            <span key="label">Lists</span>,
          ],
          link: "/lists",
          color: ButtonColor.TRANSPARENT,
          onClick: closeMenu,
        },
        {
          title: [
            <SvgGauntlet key="icon" className={styles.svg} />,
            <span key="label">Gauntlet</span>,
          ],
          link: "/gauntlet",
          color: ButtonColor.TRANSPARENT,
          onClick: closeMenu,
        },
        {
          title: [
            <SvgRandom key="icon" className={styles.svg} />,
            <span key="label">Random</span>,
          ],
          onClick: randomClickHandler,
          color: ButtonColor.TRANSPARENT,
        },
      ] as IButtonGroupItem[],
    [randomClickHandler, closeMenu]
  );

  const buttons = useMemo(
    () =>
      [
        ...menuButtons,
        {
          title: [
            <SvgSearch key="icon" className={styles.svg} />,
            <span key="label">Search</span>,
          ],
          onClick: searchClickHandler,
          color: ButtonColor.TRANSPARENT,
        },
      ].map((button) => ({ ...button, compact: true })) as IButtonGroupItem[],
    [menuButtons, searchClickHandler]
  );

  return (
    <div className={styles.container}>
      <div className={styles.container__left}>
        <Link href="/" className={styles.title} aria-label="MoonCellar">
          <Image
            src="/images/logo-text.png"
            alt="MoonCellar"
            width={747}
            height={165}
            priority
          />
        </Link>
        <Separator />
        <div className={styles.nav_mobile}>
          <div className={styles.burger} ref={menuRef}>
            <Button
              compact
              color={ButtonColor.TRANSPARENT}
              tooltip="Menu"
              onClick={() => setIsMenuOpen((prev) => !prev)}
            >
              <SvgBurger size="24" className={styles.svg} isOpen={isMenuOpen} />
            </Button>
            {isMenuOpen && (
              <div className={styles.burger__dropdown}>
                <Box isWithBlur classNameContent={styles.burger__content}>
                  <ButtonGroup
                    wrapperClassName={styles.burger__buttons}
                    buttons={menuButtons}
                  />
                </Box>
              </div>
            )}
          </div>
          <Button
            compact
            color={ButtonColor.TRANSPARENT}
            tooltip="Search"
            onClick={searchClickHandler}
          >
            <SvgSearch size="20" className={styles.svg} />
          </Button>
        </div>
        <div className={styles.nav_desktop}>
          <ButtonGroup buttons={buttons} />
        </div>
      </div>
      <div className={styles.container__right}>
        {isAuthHydrated && isAuth && <NotificationsBell />}
        {isAuthHydrated && <UserMenu />}
      </div>
    </div>
  );
};
